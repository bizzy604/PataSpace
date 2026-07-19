# S3 media read access — required for photos to render anywhere

## Why this exists

Uploads use presigned PUT URLs, so they succeed against a fully private
bucket. Read URLs are NOT presigned: the API stores plain
`https://<bucket>.s3.<region>.amazonaws.com/<key>` URLs at confirm time
(`s3-storage.provider.ts`) and every client (mobile app, admin console, web)
loads them directly. With S3 Block Public Access on (the default), every one
of those URLs returns 403 — objects exist, nothing renders.

Listing media keys all live under the `listings/` prefix
(`listings/<userId>/<folder>/<file>`, see `upload.service.ts:48`). The policy
below opens read access to that prefix only. Future private media (dispute
evidence) must use a different prefix and stays private.

## Steps (run by Amoni — these touch the production bucket)

Replace `BUCKET` with the real bucket name (`AWS_S3_BUCKET` in the VPS env).

1. Allow bucket policies while keeping ACLs blocked:

```sh
aws s3api put-public-access-block --bucket BUCKET \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

2. Attach the read policy scoped to listing media:

```sh
aws s3api put-bucket-policy --bucket BUCKET --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadListingMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET/listings/*"
    }
  ]
}'
```

3. Verify with a real stored URL (grab one from the DB or an upload response):

```sh
curl -sI "https://BUCKET.s3.eu-west-1.amazonaws.com/listings/<some-key>" | head -1
# expect: HTTP/1.1 200 OK   (403 before the policy)
```

No API restart is needed — the API already stores and returns these URLs;
only S3 was refusing to serve them.

## Later (recommended, not blocking)

Put CloudFront in front of the bucket with Origin Access Control, then set
`STORAGE_PUBLIC_BASE_URL` / `STORAGE_CDN_BASE_URL` to the CDN domain and
recreate the API container. Existing rows store absolute URLs, so switching
the base requires backfilling `Listing.thumbnailUrl`, `Listing.videoUrl`,
`ListingPhoto.url`, and `Upload.url/cdnUrl` to the new host.
