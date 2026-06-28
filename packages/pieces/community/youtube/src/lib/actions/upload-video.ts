import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';

/**
 * Upload a video to the connected YouTube channel via the YouTube Data API v3
 * resumable upload (videos.insert). Built for the "Amernet Newsletter v2 Video"
 * flow: map the HeyGen video URL into the Video field and Activepieces fetches
 * the binary, then this action publishes it to YouTube.
 *
 * Resumable upload is two requests:
 *   1) POST .../videos?uploadType=resumable&part=snippet,status with the
 *      metadata → YouTube returns a one-time upload URL in the `Location` header.
 *   2) PUT the raw bytes to that URL → returns the created video resource.
 */
export const uploadVideo = createAction({
  auth: youtubeAuth,
  name: 'upload_video',
  displayName: 'Upload Video',
  description:
    'Upload a video to your YouTube channel (e.g. a HeyGen-rendered newsletter video).',
  props: {
    video: Property.File({
      displayName: 'Video',
      description:
        'The video to upload. Map a video URL here (e.g. the HeyGen video_url) and Activepieces fetches it, or pass file data from a previous step.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    privacyStatus: Property.StaticDropdown({
      displayName: 'Privacy',
      required: true,
      defaultValue: 'private',
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'YouTube video category ID (default 22 = People & Blogs).',
      required: false,
      defaultValue: '22',
    }),
    madeForKids: Property.Checkbox({
      displayName: 'Made for kids',
      required: false,
      defaultValue: false,
    }),
    mimeType: Property.ShortText({
      displayName: 'Video MIME type',
      description: 'Defaults to video/mp4.',
      required: false,
      defaultValue: 'video/mp4',
    }),
  },
  async run(context) {
    const {
      video,
      title,
      description,
      tags,
      privacyStatus,
      categoryId,
      madeForKids,
      mimeType,
    } = context.propsValue;

    const accessToken = (context.auth as OAuth2PropertyValue).access_token;
    const bytes = Buffer.from(video.base64, 'base64');
    const contentType = mimeType || 'video/mp4';
    const tagList = Array.isArray(tags)
      ? (tags as unknown[]).map((t) => String(t)).filter(Boolean)
      : undefined;

    const metadata = {
      snippet: {
        title,
        description: description ?? '',
        ...(tagList && tagList.length ? { tags: tagList } : {}),
        categoryId: categoryId || '22',
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: !!madeForKids,
      },
    };

    // 1) Initiate the resumable upload — YouTube returns the upload URL in `Location`.
    const init = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': String(bytes.length),
      },
      body: metadata,
    });

    const headers = (init.headers ?? {}) as Record<string, string | string[]>;
    const locationRaw = headers['location'] ?? headers['Location'];
    const uploadUrl = Array.isArray(locationRaw) ? locationRaw[0] : locationRaw;
    if (!uploadUrl) {
      throw new Error(
        `YouTube did not return a resumable upload URL (HTTP ${init.status}). Response: ${JSON.stringify(
          init.body
        )}`
      );
    }

    // 2) Upload the bytes to the one-time URL — returns the created video resource.
    const upload = await httpClient.sendRequest<{ id?: string }>({
      method: HttpMethod.PUT,
      url: uploadUrl,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(bytes.length),
      },
      body: bytes,
    });

    const videoId = upload.body?.id;
    return {
      videoId,
      watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
      privacyStatus,
      raw: upload.body,
    };
  },
});
