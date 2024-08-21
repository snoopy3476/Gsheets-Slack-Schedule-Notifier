# GSheets Slack Schedule Notifier

Manage and notify team schedules to Slack, using Google Sheets and Google Apps Script.


## Features

* Shared schedule management among your team
* Automatic schedule notifications to Slack, without discrete servers
  * Using triggers on Google Apps Script instead of servers
* Temporary date, time, place, and other fields
  * When temporary values are set, they will be applied only once on a first notification, then reverted back after that
* Custom fields
  * Add your own custom field if neccesarry
  * All custom fields are displayed at detail page after pressing schedule button on Slack notification


## Get Started

To use this notifier with pre-configured settings, do the followings:

1. Visit the [sample sheet using the library](https://docs.google.com/spreadsheets/d/17Lv9EjPLb8zpH-rmHipRh_ZgHRkxIwhz5BerVOBHsko#gid=0)
2. Make a copy of it (using `[File] > [Make a copy]`)
3. Initialize the Google Sheets, Apps Script, and Slack App according to the README in the sheet

After that, the sheet will work as follows:

* Notify schedules right before of them (before about 5 minutes)
* Remind schedules before about 30 minutes
* Remind all schedules of that day every morning


## Notes

* Be aware of Apps Script quotas
  * Check the [quotas page of Apps Script](https://developers.google.com/apps-script/guides/services/quotas) before using this.  
    This notifier may consume all trigger quota for your account, if you do not configure the interval of notification triggers carefully.
  * It is recommended to create a new Google account for this Apps Script service not to exhaust your personal quotas.
