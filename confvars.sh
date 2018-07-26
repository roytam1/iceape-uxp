#! /bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

MOZ_APP_BASENAME=Iceape-UXP
MOZ_APP_VENDOR=Hyperbola
MOZ_APP_NAME=iceape-uxp
MOZ_APP_DISPLAYNAME=Iceape-UXP
MOZ_LDAP_XPCOM=1
MOZ_COMPOSER=1
MOZ_DISABLE_EXPORT_JS=1
MOZ_SUITE=1
MOZ_BRANDING_DIRECTORY=suite/branding/iceape
MOZ_OFFICIAL_BRANDING_DIRECTORY=suite/branding/iceape
MOZ_UPDATER=1
# This should usually be the same as the value MAR_CHANNEL_ID.
# If more than one ID is needed, then you should use a comma separated list
# of values.
ACCEPTED_MAR_CHANNEL_IDS=iceape-comm-central
# The MAR_CHANNEL_ID must not contain the following 3 characters: ",\t "
MAR_CHANNEL_ID=iceape-comm-central
MOZ_MORK=1
MOZ_SERVICES_FXACCOUNTS=1
MOZ_STATIC_BUILD_UNSUPPORTED=1
MOZ_WEBGL_CONFORMANT=1
MOZ_WEBM_ENCODER=1
MOZ_BINARY_EXTENSIONS=1
MOZ_RUST_MP4PARSE=
MOZ_RUST_URLPARSE=
MOZ_DOMINSPECTOR=

# For Iceape-UXP we want to use 52.9.YYYYMMDD as MOZ_APP_VERSION in release
# builds.
# To enable add "export ICEAPEUXP_VERSION=1" to the .mozconfig file.
# However, this will cause a full rebuild at 00:00 UTC every day so
# don't export the variable if you are in development or don't care.
# When not exported we fall back the value in the version*.txt file.
if test -n "$ICEAPEUXP_VERSION" ; then
    MOZ_APP_VERSION=52.9.`date --utc '+%Y%m%d'`
    ICEAPEUXP_VERSION=$MOZ_APP_VERSION
else
    MOZ_APP_VERSION_TXT=${_topsrcdir}/$MOZ_BUILD_APP/config/version.txt
    MOZ_APP_VERSION=`cat $MOZ_APP_VERSION_TXT`
    ICEAPEUXP_VERSION=$MOZ_APP_VERSION
fi

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
