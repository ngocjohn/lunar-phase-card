<a id="v1.9.0"></a>
# [v1.9.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.9.0) - 2024-12-11

<!-- Release notes generated using configuration in .github/release.yml at v1.9.0 -->

## What's Changed
### New Features 🎉 
- **Dynamic Horizon Chart**: Experience real-time elevation tracking with a seamless 48-hour range, including a 6-hour historical offset for enhanced visualization. By [@ngocjohn](https://github.com/ngocjohn) in [#45](https://github.com/ngocjohn/lunar-phase-card/pull/45)
- **Redesigned Calendar**: A sleek new look for the calendar to align perfectly with the card’s overall style, creating a more cohesive design. By [@ngocjohn](https://github.com/ngocjohn) in [#51](https://github.com/ngocjohn/lunar-phase-card/pull/51) [#46](https://github.com/ngocjohn/lunar-phase-card/pull/46)
- **Hide Header Option**: Added an option to hide the header, perfect for those who prefer a cleaner and minimalist design. 

### Fixes & Improvements
- **Improved Chart Usability**: Resolved issues when manipulating the chart on touch screen devices, ensuring a smoother and more responsive experience.
- **German Translations**: Updated and improved German translations for better localization. By [@NoRi2909](https://github.com/NoRi2909) in [#44](https://github.com/ngocjohn/lunar-phase-card/pull/44) [#48](https://github.com/ngocjohn/lunar-phase-card/pull/48)

### Showcase
Take a look at the new features in action!

#### Redesigned Calendar Modal
![calendar-modal](https://github.com/user-attachments/assets/5e2a12f6-18fc-477c-b0bf-c3e0e20d1b64)

#### Minimalist Design Without Header
![CleanShot 2024-12-11 at 21 30 24@2x](https://github.com/user-attachments/assets/05aa4230-a24c-4754-ac73-bb3580dbf487)

---

If you’re enjoying these updates, please ⭐ the repository to show your support! 🌚


**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.8.1...v1.9.0

[Changes][v1.9.0]


<a id="v1.8.1"></a>
# [v1.8.1](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.8.1) - 2024-11-20

<!-- Release notes generated using configuration in .github/release.yml at v1.8.1 -->

## What's Changed
### Other Changes
* Update de.json to fix the moon phase labels by [@NoRi2909](https://github.com/NoRi2909) in [#43](https://github.com/ngocjohn/lunar-phase-card/pull/43)

## New Contributors
* [@NoRi2909](https://github.com/NoRi2909) made their first contribution in [#43](https://github.com/ngocjohn/lunar-phase-card/pull/43)

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.8.0...v1.8.1

[Changes][v1.8.1]


<a id="v1.8.0"></a>
# [v1.8.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.8.0) - 2024-11-15

<!-- Release notes generated using configuration in .github/release.yml at v1.8.0 -->

## What's Changed
### New Features 🎉
* **Southern hemisphere option to config**  in [#39](https://github.com/ngocjohn/lunar-phase-card/pull/39)
You can now switch to a southern hemisphere view of the moon phases. This option adjusts the moon's orientation and path as observed from the southern hemisphere.

* **Search function to get coordinates by city and country**  in [#41](https://github.com/ngocjohn/lunar-phase-card/pull/41)
A new feature that allows users to search for a location by entering the city and country. This returns the corresponding latitude and longitude, making it easier to configure location-based data.

* **Chart configuration options** such as displaying x/y labels, current moon position, legends, and more 
Users can now configure the appearance of the moon phase chart with options like showing or hiding axis labels, displaying the current moon position, and toggling chart legends for a more customized view.

### Fixes 🐛
* **Fixed moon phase translations in Dutch language file** in [#40](https://github.com/ngocjohn/lunar-phase-card/pull/40)
![lunar-graph-config](https://github.com/user-attachments/assets/6371b993-c826-4372-af04-83e6732bc395)
![lunar-search](https://github.com/user-attachments/assets/e06bceff-9f17-47ca-b131-8ba1f3e38433)

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.7.3...v1.8.0

[Changes][v1.8.0]


<a id="v1.7.2"></a>
# [v1.7.2](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.7.2) - 2024-11-07

<!-- Release notes generated using configuration in .github/release.yml at v1.7.2 -->

## What's Changed
### New Features 🎉
* **Full Moon Phase Calendar**: Added an all-new calendar feature that allows users to view the moon phase for every day of the month. This enhancement makes it easier to plan and track lunar events throughout the month. [#37](https://github.com/ngocjohn/lunar-phase-card/pull/37)
* **Configurable Axis Ticks**: Introduced a configuration setting that lets users customize the visibility of ticks on the x and y axes in the horizon graph. This option provides greater flexibility in how data is presented and improves readability based on user preference.
* **Graph Design Overhaul**: Significantly improved the design of the horizon graph, making it clearer and more engaging. The graph is now more interactive, with smoother transitions and better visual.
* **Initial Card Type Setting**: Added an option to set the initial card type (base, calendar, horizon), allowing users to control which view appears by default when opening the card.
* **Decimal Precision Configuration**: Added a configuration option to set the number of decimal places displayed for numerical values, giving users more control over data precision.

![moon-calendar](https://github.com/user-attachments/assets/30adf30d-cb62-419c-8706-061dd12bd722)

![moon-graph](https://github.com/user-attachments/assets/8a31d9be-e750-402e-ba16-89882d00848f)

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.7.1...v1.7.2

[Changes][v1.7.2]


<a id="v1.7.1"></a>
# [v1.7.1](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.7.1) - 2024-11-02

<!-- Release notes generated using configuration in .github/release.yml at v1.7.1 -->

## What's Changed
### New Features 🎉
- **Update Horizon Graph with Hover Interaction**: Added a new hover feature to the graph points, allowing you to interact with and retrieve data by hovering over specific points. Updates the graph data in real-time based on the current time for a more accurate and dynamic user experience. [#36](https://github.com/ngocjohn/lunar-phase-card/pull/36)

### Bug Fixes 🐛
- Fixed minor bugs present in the previous release to enhance stability and performance.


![moon-horizon-graph](https://github.com/user-attachments/assets/b02f9d1f-3f4b-4d7c-93e1-cf64b5ab2900)


**Full Changelog**: [View Changes](https://github.com/ngocjohn/lunar-phase-card/compare/v1.7.0...v1.7.1)

[Changes][v1.7.1]


<a id="v1.7.0"></a>
# [v1.7.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.7.0) - 2024-11-02

## What's Changed
### New Features 🎉
- **Moon Position Details**: Added additional information about the moon positions in the Graph subcard, including position, direction, altitude, azimuth and distance.
- **Distance Unit Option**: Added an option to display the distance unit in Miles, providing more flexibility for users in the United States and other regions using the imperial system.

### Translations 🌍
- **Spanish (es.json)**: Added Spanish translations [#29](https://github.com/ngocjohn/lunar-phase-card/pull/29).

If you enjoy these new features, consider giving the repo a ⭐ to show your support! 🚀

![moon-graph-added-info](https://github.com/user-attachments/assets/10fab2a0-37d2-445e-9adf-d68e7b9bc848)

**Full Changelog**: [View Changes](https://github.com/ngocjohn/lunar-phase-card/compare/v1.6.0...v1.7.0)

[Changes][v1.7.0]


<a id="v1.6.0"></a>
# [v1.6.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.6.0) - 2024-10-26

<!-- Release notes generated using configuration in .github/release.yml at v1.6.0 -->

## What's Changed
### New Features 🎉
* Add Moon horizon graph by [@ngocjohn](https://github.com/ngocjohn) in [#26](https://github.com/ngocjohn/lunar-phase-card/pull/26)

The graph displays the altitude of the Moon throughout the day. It also includes moon phase information and moon rise/set times.
![2024-10-26 04 14 59](https://github.com/user-attachments/assets/182d8a36-e7d7-459b-b0a7-a6f24148a730)
If you enjoy these new features, consider giving the repo a ⭐ to show your support! 🚀
**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.5.0...v1.6.0

[Changes][v1.6.0]


<a id="v1.5.0"></a>
# [v1.5.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.5.0) - 2024-10-23

<!-- Release notes generated using configuration in .github/release.yml at v1.5.0 -->

## What's Changed
### New Features 🎉
* Add option to set Moon position on card in [#25](https://github.com/ngocjohn/lunar-phase-card/pull/25)

The default position is on the left side, but users can now choose to display it on the right side as well. 
### Translations 🌍
* Add nl.json Dutch by [@ngocjohn](https://github.com/ngocjohn) in [#24](https://github.com/ngocjohn/lunar-phase-card/pull/24)


**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.4.0...v1.5.0

[Changes][v1.5.0]


<a id="v1.4.0"></a>
# [v1.4.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.4.0) - 2024-09-05

<!-- Release notes generated using configuration in .github/release.yml at v1.4.0 -->

## What's Changed
### Translations 🌍
* Update de.json by [@f-zappa](https://github.com/f-zappa) in [#21](https://github.com/ngocjohn/lunar-phase-card/pull/21)
* Add Russian language by [@stakost](https://github.com/stakost) in [#22](https://github.com/ngocjohn/lunar-phase-card/pull/22)
* Add it.json by [@aldogiu](https://github.com/aldogiu) in [#23](https://github.com/ngocjohn/lunar-phase-card/pull/23)

## New Contributors
* [@f-zappa](https://github.com/f-zappa) made their first contribution in [#21](https://github.com/ngocjohn/lunar-phase-card/pull/21)
* [@stakost](https://github.com/stakost) made their first contribution in [#22](https://github.com/ngocjohn/lunar-phase-card/pull/22)
* [@aldogiu](https://github.com/aldogiu) made their first contribution in [#23](https://github.com/ngocjohn/lunar-phase-card/pull/23)

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.3.0...v1.4.0

[Changes][v1.4.0]


<a id="v1.3.0"></a>
# [v1.3.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.3.0) - 2024-08-24

## v1.3.0 - Enhanced Translations and Customization Options

### What's New
With the addition of new translations, it became apparent that each language has unique naming conventions. To address this, I've prepared a small update to enhance the flexibility and customization of the card's appearance, especially in the compact view.

Now, you can individually customize fonts, hide labels, adjust header sizes, change colors, and more to better suit your needs.

### What's Changed
* **Add Catalan language** by [@carlesfernandez](https://github.com/carlesfernandez) in [#10](https://github.com/ngocjohn/lunar-phase-card/pull/10)
* **Add French language** by [@ThibaultDenoual](https://github.com/ThibaultDenoual) in [#11](https://github.com/ngocjohn/lunar-phase-card/pull/11)
* **Add Slovak translation for lunar phase card** by [@ngocjohn](https://github.com/ngocjohn) in [#18](https://github.com/ngocjohn/lunar-phase-card/pull/18)
* **Add font customization options and styles** by [@ngocjohn](https://github.com/ngocjohn) in [#13](https://github.com/ngocjohn/lunar-phase-card/pull/13)

## New Contributors
* [@carlesfernandez](https://github.com/carlesfernandez) made their first contribution in [#10](https://github.com/ngocjohn/lunar-phase-card/pull/10)
* [@ThibaultDenoual](https://github.com/ThibaultDenoual) made their first contribution in [#11](https://github.com/ngocjohn/lunar-phase-card/pull/11)

A big thank you to all the contributors who helped make this release possible. Your efforts in improving translations and adding new features are greatly appreciated!

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.2.0...v1.3.0

[Changes][v1.3.0]


<a id="v1.2.0"></a>
# [v1.2.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.2.0) - 2024-08-20

## What's Changed

This update introduces several new translations and a small CSS enhancement. Thanks to our new contributors for their valuable additions  and users for their interest in this card! 🌚 

- Added German translation (`de.json`) by [@Tamsy](https://github.com/ngocjohn/lunar-phase-card/pull/3)
- Added Indonesian translation (`id.json`) by [@Tamsy](https://github.com/ngocjohn/lunar-phase-card/pull/4)
- Added Danish translation (`da.json`) by [@Tntdruid](https://github.com/ngocjohn/lunar-phase-card/pull/6)
- Updated Indonesian translation with missing strings by [@Tamsy](https://github.com/ngocjohn/lunar-phase-card/pull/7)
- Added Brazilian Portuguese translation (`pt-br.json`) by [@Tamsy](https://github.com/ngocjohn/lunar-phase-card/pull/8) and [@alexandrechoske](https://github.com/alexandrechoske)
- Updated CSS font size for the header - moon phase name by [@ngocjohn](https://github.com/ngocjohn/lunar-phase-card/pull/9)

## New Contributors

- [@Tamsy](https://github.com/Tamsy) made their first contribution in [#3](https://github.com/ngocjohn/lunar-phase-card/pull/3)
- [@Tntdruid](https://github.com/Tntdruid) made their first contribution in [#6](https://github.com/ngocjohn/lunar-phase-card/pull/6)
- [@ngocjohn](https://github.com/ngocjohn) made their first contribution in [#9](https://github.com/ngocjohn/lunar-phase-card/pull/9)

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.1.0...v1.2.0

[Changes][v1.2.0]


<a id="v1.1.0"></a>
# [v1.1.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.1.0) - 2024-08-15

## What's Changed

### 1. Localization Support
- **Multi-language Support**: Now supports multiple languages via the `selected_language` option, defaulting to system language or English (`en`).

### 2. UI Editor Configurator
- **GUI Configuration**: Configure the card directly in the Lovelace UI editor, no YAML editing required.
- **Live Preview**: Instantly see changes as you adjust settings in the editor.

### 3. File Upload Directly to HA Instance
- **Custom Backgrounds**: Upload and use custom background images directly in your Home Assistant instance via the `custom_background` option.
- **Simplified Workflow**: Easier handling of custom images without manual file placement.

We welcome contributions and are grateful for your support in improving this project. If you'd like to contribute new translations, please follow our [Contribution Guidelines](https://github.com/ngocjohn/lunar-phase-card/blob/main/docs/CONTRIBUTING.md) to get started.

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/compare/v1.0.0...v1.1.0

[Changes][v1.1.0]


<a id="v1.0.0"></a>
# [v1.0.0](https://github.com/ngocjohn/lunar-phase-card/releases/tag/v1.0.0) - 2024-07-24

## Initial Release
- Introduced the Lunar Phase Custom Card for Home Assistant.
- Displays the current lunar phase with detailed monthly phase information.
- Provides options for custom latitude and longitude configuration.
- Offers a visually appealing and informative lunar phase tracker for the Home Assistant dashboard.

**Full Changelog**: https://github.com/ngocjohn/lunar-phase-card/commits/v1.0.0

[Changes][v1.0.0]


[v1.9.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.8.1...v1.9.0
[v1.8.1]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.8.0...v1.8.1
[v1.8.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.7.2...v1.8.0
[v1.7.2]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.7.1...v1.7.2
[v1.7.1]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.7.0...v1.7.1
[v1.7.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.6.0...v1.7.0
[v1.6.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.5.0...v1.6.0
[v1.5.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.4.0...v1.5.0
[v1.4.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.3.0...v1.4.0
[v1.3.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.2.0...v1.3.0
[v1.2.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.1.0...v1.2.0
[v1.1.0]: https://github.com/ngocjohn/lunar-phase-card/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/ngocjohn/lunar-phase-card/tree/v1.0.0

<!-- Generated by https://github.com/rhysd/changelog-from-release v3.8.1 -->
