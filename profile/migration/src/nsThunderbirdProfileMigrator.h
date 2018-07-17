/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef ThunderbirdProfileMigrator_h__
#define ThunderbirdProfileMigrator_h__

#include "nsISuiteProfileMigrator.h"
#include "nsIFile.h"
#include "nsIObserverService.h"
#include "nsNetscapeProfileMigratorBase.h"
#include "nsStringAPI.h"
#include "nsITimer.h"
#include "mozilla/Attributes.h"

class nsIFile;
class nsIPrefBranch;
class nsIPrefService;

#define NS_THUNDERBIRDPROFILEMIGRATOR_CID \
{ 0x6ba91adb, 0xa4ed, 0x405f, { 0xbd, 0x6c, 0xe9, 0x04, 0xa9, 0x9d, 0x9a, 0xd8 } }

class nsThunderbirdProfileMigrator final : public nsNetscapeProfileMigratorBase
{
public:
  NS_DECL_ISUPPORTS

  nsThunderbirdProfileMigrator();

  // nsISuiteProfileMigrator methods
  NS_IMETHOD Migrate(uint16_t aItems, nsIProfileStartup *aStartup,
                     const char16_t *aProfile) override;
  NS_IMETHOD GetMigrateData(const char16_t *aProfile, bool aDoingStartup,
                            uint16_t *_retval) override;
  NS_IMETHOD GetSupportedItems(uint16_t *aSupportedItems) override;

protected:
  virtual ~nsThunderbirdProfileMigrator();
  nsresult FillProfileDataFromRegistry() override;
  nsresult CopyPreferences(bool aReplace);
  nsresult TransformPreferences(const char* aSourcePrefFileName,
                                const char* aTargetPrefFileName);
  nsresult CopyHistory(bool aReplace);
  nsresult CopyPasswords(bool aReplace);
};

#endif
