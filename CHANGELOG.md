# Change Log

All notable changes to the "ngrok-for-vscode" extension will be documented in this file.

## [0.3.1] - 2022-01-05

### Changed

- Preview gif.
- vscode package settings.
- Changed activation event to `onStartupFinished` for performance reasons.

## [0.3.0] - 2022-01-04

### Added

- Graphical interface to start and stop the tunnel.
- Config settings to enable or thisable the GUI.

## [0.2.3] - 2021-11-23

### Added

- Allow using hostnames other than `localhost`.

### Changed

- Fix cloudflared client downloading multiple times.

## [0.2.2] - 2021-11-22

### Changed

- Set cloudflared client permissions after downloading in linux.

## [0.2.1] - 2021-11-22

### Changed

- Refactor command related code.

## [0.2.0] - 2021-11-22

### Added

- Login to cloudflare.
- Add custom domain through settings.

### Changed

- Improved error handling.
- Stop running tunnel if already started.

## [0.1.0] - 2021-11-21

### Added

- Initial release.
- Start tunnel command.
- Stop tunnel command.
- Is running command.
- Port input.
- Automatically download clourdflared client.
