#! /bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

MOZ_APP_BASENAME=SeaMonkey
MOZ_APP_VENDOR=Mozilla
MOZ_APP_NAME=seamonkey
MOZ_APP_DISPLAYNAME=SeaMonkey
MOZ_LDAP_XPCOM=1
MOZ_COMPOSER=1
MOZ_DISABLE_EXPORT_JS=1
MOZ_SUITE=1
MOZ_BRANDING_DIRECTORY=suite/branding/nightly
MOZ_OFFICIAL_BRANDING_DIRECTORY=suite/branding/nightly
MOZ_EXTENSIONS_DEFAULT=" inspector irc gio"
MOZ_UPDATER=1
# This should usually be the same as the value MAR_CHANNEL_ID.
# If more than one ID is needed, then you should use a comma separated list
# of values.
ACCEPTED_MAR_CHANNEL_IDS=seamonkey-comm-central
# The MAR_CHANNEL_ID must not contain the following 3 characters: ",\t "
MAR_CHANNEL_ID=seamonkey-comm-central
MOZ_MORK=1
MOZ_SERVICES_FXACCOUNTS=1
MOZ_STATIC_BUILD_UNSUPPORTED=1
MOZ_WEBGL_CONFORMANT=1
MOZ_WEBM_ENCODER=1
MOZ_BINARY_EXTENSIONS=1
MOZ_RUST_MP4PARSE=1
MOZ_RUST_URLPARSE=1

MOZ_APP_VERSION_TXT=${_topsrcdir}/$MOZ_BUILD_APP/config/version.txt
MOZ_APP_VERSION=`cat $MOZ_APP_VERSION_TXT`
SEAMONKEY_VERSION=$MOZ_APP_VERSION

MOZ_UA_BUILDID=20100101

MOZ_APP_ID={92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}
MOZ_PROFILE_MIGRATOR=1
MOZ_APP_STATIC_INI=1
MOZ_SEPARATE_MANIFEST_FOR_THEME_OVERRIDES=1

if test "$OS_ARCH" = "WINNT" -o \
        "$OS_ARCH" = "Linux"; then
  MOZ_BUNDLED_FONTS=1
fi

# Include the DevTools client, not just the server (which is the default)
MOZ_DEVTOOLS=all
