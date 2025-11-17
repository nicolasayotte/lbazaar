# Postman Test Suite

This collection mirrors the behaviour of the Laravel Feature tests that exercise the public API surface.

## Prepare the database

1. Ensure the Sail stack is running.
2. Run fresh migrations if needed: `./vendor/bin/sail artisan migrate`.
3. Seed the deterministic fixtures required by the collection:
   `./vendor/bin/sail artisan db:seed --class=PostmanTestSeeder`.

The seeder provisions:
- Teacher, secondary teacher, and two student accounts that the collection logs in as
- Two courses (`Postman Mintable Course`, `Postman Empty Course`) alongside schedules and histories
- Wallet records mirroring the PHPUnit expectations

## Local helper endpoints

Two helper endpoints are available only in the `local` environment:
- `POST /api/postman/token`: exchanges fixture credentials for a transient Sanctum token
- `GET /api/postman/fixtures`: returns the seeded entity ids so the collection can populate variables

Both routes live behind the `local` environment check and are not exposed in production builds.

## Importing into Postman

1. Import `postman/lbazaar.postman_collection.json`.
2. Import `postman/local.postman_environment.json` and select it for the workspace.
3. Run the four requests under **Auth** to store tokens in the active environment.
4. Run **Fixtures › Fetch Fixture Ids** to populate `mintable_course_id` and `empty_course_id`.
5. Execute the remaining folders to mirror the PHPUnit feature coverage.
   Disable the "Mint & Airdrop succeeds" request when the external certificate service is unavailable—otherwise it will still pass but report the run as a no-op (zero successes) in the results array.

## Command line execution

Run the entire suite headlessly with Newman (inside the Sail container so `http://localhost` resolves correctly):

```bash
./vendor/bin/sail bash
npm run postman:test
```

The script uses `npx` so no global Newman installation is required.
