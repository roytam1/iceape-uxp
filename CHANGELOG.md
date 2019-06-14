# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
## [v1.4]

## [v1.3] - 2019-06-15
### Added
- Remember spell check language in mailnews composer

### Fixed
- UserAgent string displaying calendar version string in Navigator (should only display UA)
- Various MailNews bug fixes inherited from Icedove-UXP
- Make middleclick close tabs on all platforms.

### Security
- Backport c-c 1234651: Check view targets for possible unsafe content. (XSS fix)

## [v1.2] - 2018-11-25
### Added
- Zoom Controls in Status Bar
- UserAgent override
- Asynchronous FormHistory.jsm in place of nsIFormHistory2

## [v1.1] - 2018-11-25
### Fixed
- Broken links
- Various minor bug fix backports
- FindBar CSS not properly displaying on GNU/Linux (FS#1021)
- Web Developer Tool Fixes + EyeDropper Tool restoration

### Removed
- Feed and Pcast related protocols

### Security
- Opportunistic encryption preference Enabled by default

## [v1.0] - 2018-09-08
### Added
- Initial Import of SeaMonkey 2.49
- Iceape Branding
- Our Search Plugins

### Changed
- GUID
- API Changes: SEC_NORMAL
- Restored classic Error Console
- Change default search engines

### Removed
- SeaMonkey Branding
- AOL Instant Messenger support from AddressBook
- Google Safe Browsing
- All Rust Code
- Chromium sandbox


[Unreleased]: https://git.hyperbola.info:50100/software/iceape-uxp.git/log/
[v1.0]: https://git.hyperbola.info:50100/software/iceape-uxp.git/tag/?h=v1.0
[v1.1]: https://git.hyperbola.info:50100/software/iceape-uxp.git/tag/?h=v1.1
[v1.2]: https://git.hyperbola.info:50100/software/iceape-uxp.git/tag/?h=v1.2
[v1.3]: https://git.hyperbola.info:50100/software/iceape-uxp.git/tag/?h=v1.3
