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


## Usage Examples

1. If the sheet above (sample sheet) is filled as follows:  
   ![sheet-before](https://github.com/snoopy3476/Gsheets-Slack-Schedule-Notifier/blob/f910558b9e7fd8b95e94bc016e6efa875a0351fe/readme-asset/sheet-before.png?raw=true)

2. Slack connected with the sheet receives notifications as follows:  
   | Desktop | Mobile | Mobile (Noti Preview) |
   |:-------:|:------:|:---------------------:|
   | ![example-desktop](https://github.com/snoopy3476/Gsheets-Slack-Schedule-Notifier/blob/f910558b9e7fd8b95e94bc016e6efa875a0351fe/readme-asset/example-desktop.jpg?raw=true) | ![example-mobile](https://github.com/snoopy3476/Gsheets-Slack-Schedule-Notifier/blob/f910558b9e7fd8b95e94bc016e6efa875a0351fe/readme-asset/example-mobile.jpg?raw=true) | ![example-mobile-noti](https://github.com/snoopy3476/Gsheets-Slack-Schedule-Notifier/blob/f910558b9e7fd8b95e94bc016e6efa875a0351fe/readme-asset/example-mobile-noti.jpg?raw=true) |

4. And the schedules without repeat flag are unchecked after notified as follows:  
   ![sheet-after](https://github.com/snoopy3476/Gsheets-Slack-Schedule-Notifier/blob/f910558b9e7fd8b95e94bc016e6efa875a0351fe/readme-asset/sheet-after.png?raw=true)


## Use the Library in Google Apps Script Directly

You can [add the source library to your Google Apps Script project](https://developers.google.com/apps-script/guides/libraries) without using the sample sheet above that uses this library.

* Apps Script Library ID: `1CZ1rh6cvKlu9bTpNwCZ_1nbqd38704CC3kOBnTIGOErvZCfcdRT2fdv7`


## Notes

* Be aware of Apps Script quotas
  * Check the [quotas page of Apps Script](https://developers.google.com/apps-script/guides/services/quotas) before using this.  
    This notifier may consume all trigger quota for your account, if you do not configure the interval of notification triggers carefully.
  * It is recommended to create a new Google account for this Apps Script service not to exhaust your personal quotas.
