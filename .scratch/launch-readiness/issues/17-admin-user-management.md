# No way to create an admin from the UI

Status: ready-for-agent

## Problem

`role` is set to `admin` only by the seed script or by editing MongoDB directly. The
customers admin page is read-only — no role changes, no invites, no deactivation. If the one
admin account is lost, recovery means a database edit.

## Fix

- Promote and demote roles from the customers admin page, with a guard against removing the
  last remaining admin
- Invite an admin by email (depends on issue 03 for delivery)
- Deactivate an account without deleting it, so its orders keep resolving
