# Cloudinary API key has no permissions — image upload is dead

Status: ready-for-human

## Problem

`POST /api/upload` returns 500 for every file. The upload code is fine; Cloudinary rejects
the credentials:

```
403 [prodenv:4e3d800002dd5706357052e691a2bc] Request forbidden due to missing permissions (actions=["read"])
```

The same 403 comes back from a plain credentials ping against
`https://api.cloudinary.com/v1_1/dxmf4q1p6/usage`, so this is not an upload-path bug — the
key in `.env` is a restricted/scoped key, or it belongs to a different Cloudinary product
environment than cloud `dxmf4q1p6`.

Consequence: no product image can be uploaded through the admin panel at all. The launch
catalogue ships behind a static placeholder because of this.

## Fix

1. In the Cloudinary console (Settings → API Keys) for cloud `dxmf4q1p6`, issue a key with
   full upload and read access — or confirm the cloud name is wrong and supply the right
   account.
2. Replace `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` in `.env` and in the Vercel
   project environment.
3. Verify: `curl -s https://api.cloudinary.com/v1_1/<cloud>/usage -u "<key>:<secret>"`
   should return JSON, not a 403. Then upload one image through `/admin/products/new`.

Only the account owner can issue keys, which is why this sits with a human.
