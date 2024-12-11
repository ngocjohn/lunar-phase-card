<a name="readme-top"></a>

[![hacs][hacs-validate]][hacs-validate-link] ![total-downloads] ![latest-downloads]

# 🌘 Lunar Phase Card

<a href="#"><img src="https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/header.gif" style="border-radius: 8px" /></a>

##

<p style="text-align: justify;">This is a Lovelace custom card for Home Assistant that provides detailed information about the current phase of the moon. This card leverages precise astronomical calculations to deliver accurate lunar data, making it a valuable addition for those interested in astronomy, astrology, or just tracking the moon's phases.</p>


## Table of contents

<details>
    <summary>Table of contents</summary>

- [Overview](#Lunar-Phase-Card)
- [Features](#features)
- [Installation](#installation)
  - [HACS Installation](#hacs-installation)
  - [Manual Installation](#manual-installation)
- [Configuration](#configuration)

</details>

## Features

- **Current Lunar Phase Display:** Shows the current phase of the moon.
- **Detailed Lunar Information:** Provides additional details about the lunar cycle.
- **Customizable:** Easily customizable to fit your dashboard's theme.
- **Responsive Design:** Works well on both desktop and mobile devices.
- **Custom Latitude and Longitude Configuration:** Offers the possibility to configure custom latitude and longitude for precise lunar data.
- **Specific Date Lunar Information:** Option to display the moon information for a specific date.
- **Multilingual Support**: The card includes various translations, making it accessible in multiple languages.






### Supported Localization

<details>
  <summary>The following languages are supported in this project</summary>

| Language Code | Name     | Native Name     |
| ------------- | ---------| ----------------|
| `ca` | Catalan | Català |
| `cs` | Czech | Čeština |
| `da` | Danish | Dansk |
| `de` | German | Deutsch |
| `en` | English | English |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `id` | Indonesian | Bahasa Indonesia |
| `it` | Italian | Italiano |
| `nl` | Nederlands | Dutch |
| `pt` | Portuguese | Português (Brasil) |
| `ru` | Русский | Русский |
| `sk` | Slovak | Slovenčina |

</details>


### View options
* Default view
![Default card][header-default-card]
![Default no header][no-header-default-card]
* Calendar card
![Calendar card][header-calendar-card]
![Calendar no header][no-header-calendar]
* Horizon graph
![Dynamic card no header][no-header-dynamic-graph]
![Horizon card][header-horizon-graph]
![Horizon card no header][no-header-horizon-graph]
* Compact view
![Compact card][header-compact-card]
![Compact card no header][no-header-compact-card]




## Installation

### [HACS](https://hacs.xyz) (Home Assistant Community Store)

1. Go to HACS page on your Home Assistant instance
2. Add this repository via HACS Custom repositories [How to add Custom Repositories](https://hacs.xyz/docs/faq/custom_repositories/)

```
https://github.com/ngocjohn/lunar-phase-card
```

3. Select `Dashboard`
1. Press add icon and search for `Lunar Phase Card`
1. Select Lunar Phase Card repo and install
1. Force refresh the Home Assistant page `Ctrl` + `F5` / `Shift` + `⌘` + `R`
1. Add lunar-phase-card to your page

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ngocjohn&repository=lunar-phase-card&category=plugin)

### Manual

<details>
  <summary>Click to expand installation instructions</summary>

1. Download the [lunar-phase-card.js](https://github.com/ngocjohn/lunar-phase-card/releases/latest).
2. Place the downloaded file on your Home Assistant machine in the `config/www` folder (when there is no `www` folder in the folder where your `configuration.yaml` file is, create it and place the file there).
3. In Home Assistant go to `Configuration->Lovelace Dashboards->Resources` (When there is no `resources` tag on the `Lovelace Dashboard` page, enable advanced mode in your account settings, and retry this step).
4. Add a new resource:
   - Url = `/local/lunar-phase-card.js`
   - Resource type = `module`
5. Force refresh the Home Assistant page `Ctrl` + `F5` / `Shift` + `⌘` + `R`.
6. Add lunar-phase-card to your page.

</details>

## Configuration

<p style="text-align: justify;">All options can be configured in the GUI editor. To configure the Lunar Phase Card, you can use the following parameters in your Lovelace configuration:</p>

![Card config editor][card-config-editor]

| Name                | Type    | Requirement | Description                                                           |
| ------------------- | ------- | ----------- | --------------------------------------------------------------------- |
| `type`              | string  | Required    | The type of the card. For this card, use `custom:lunar-phase-card`.   |
| `entity`            | string  | Optional    | The entity_id from Lunar Phase custom component `sensor.*_moon_phase` |
| `use_default`       | boolean | Optional    | Whether to use default settings. Defaults to `true`.                  |
| `use_entity`        | boolean | Optional    | Whether to use entity settings. Defaults to `false`.                  |
| `use_custom`        | boolean | Optional    | Whether to use custom settings. Defaults to `false`.                  |
| `show_background`   | boolean | Optional    | Whether to show the background image. Defaults to `false`.            |
| `compact_view`      | boolean | Optional    | Whether to display the card in a compact view. Defaults to `false`.   |
| `12hr_format`       | boolean | Optional    | Whether to display time in 12-hour format. Defaults to `false`.       |
| `mile_unit`         | boolean | Optional    | Whether to display distance in miles. Defaults to `false`.            |
| `hide_buttons`       | boolean | Optional    | Whether to hide the buttons in header. Defaults to `false`.          |
| `calendar_modal`    | boolean | Optional    | Whether to use calendar as modal popup. Defaults to `false`.          |
| `default_card`      | string  | Optional    | Default view of the card. Options: `base`, `calendar`, `horizon`. Defaults to `base`. |
| `moon_position`     | string  | Optional    | Position of the moon image. Options: `left`, `right`. Defaults to `left`. |
| `southern_hemisphere` | boolean | Optional  | Adjusts the moon orientation for southern hemisphere users. Defaults to `false`. |
| `number_decimals`   | number  | Optional    | Number of decimals for numerical values. Defaults to `2`.             |
| `selected_language` | string  | Optional    | ISO code of the language to be used. Defaults to system or `en`.      |
| `latitude`          | number  | Optional    | The latitude for which to calculate the lunar phase.                  |
| `longitude`         | number  | Optional    | The longitude for which to calculate the lunar phase.                 |
| `font_customize`    | object  | Optional    | Customize fonts for the card. See below for details.                  |
| `graph_config`      | object  | Optional    | Configuration for the chart. See below for details.                   |
> [!NOTE]
> The `entity` parameter is not required. It refers to the entity ID from the Lunar Card Custom component, which can be installed [here](https://github.com/ngocjohn/lunar-phase). If the `entity` is not defined, the card will use the default latitude and longitude from the system configuration.
### Font Customization Options
| Name                  | Type    | Description                                                               |
| --------------------- | ------- | ------------------------------------------------------------------------- |
| `header_font_size`    | string  | Font size for the header. Options: `auto`, `small`, `medium`, `large`, `x-large`, `xx-large`. Defaults to `x-large`. |
| `header_font_style`   | string  | Text style for the header. Options: `none`, `capitalize`, `uppercase`, `lowercase`. Defaults to `capitalize`. |
| `header_font_color`   | string  | Color for the header text.                                                |
| `label_font_size`     | string  | Font size for labels. Options: `auto`, `small`, `medium`, `large`, `x-large`, `xx-large`. Defaults to `auto`. |
| `label_font_style`    | string  | Text style for labels. Options: `none`, `capitalize`, `uppercase`, `lowercase`. Defaults to `none`. |
| `label_font_color`    | string  | Color for label text.                                                     |
| `hide_label`          | boolean | Whether to hide labels on the card. Defaults to `false`.                  |

### Chart Configuration Options
| Name                  | Type    | Description                                                               |
| --------------------- | ------- | ------------------------------------------------------------------------- |
| `graph_type`          | string  | Type of the graph. Options: `default`, `dynamic`. Defaults to `default`.  |
| `y_ticks`             | boolean | Whether to show y-axis ticks. Defaults to `false`.                        |
| `x_ticks`             | boolean | Whether to show x-axis ticks. Defaults to `false`.                        |
| `show_time`           | boolean | Whether to show time labels on the chart. Defaults to `true`.             |
| `show_current`        | boolean | Whether to show the current moon position. Defaults to `true`.            |
| `show_highest`        | boolean | Whether to show the highest moon point. Defaults to `true`.               |
| `y_ticks_position`    | string  | Position of the y-axis ticks. Options: `left`, `right`. Defaults to `left`.|
| `y_ticks_step_size`   | number  | Step size for y-axis ticks. Defaults to `30`.                             |
| `time_step_size`      | number  | Step size for time labels. Defaults to `30`.                              |


### Example Configuration

Here's an example configuration for the Lunar Phase Card:

```yaml
type: custom:lunar-phase-card
entity: ""
use_default: true
use_custom: false
use_entity: false
show_background: true
selected_language: en
compact_view: false
12hr_format: false
mile_unit: false
hide_buttons: false
calendar_modal: false
default_card: base
moon_position: left
southern_hemisphere: false
number_decimals: 2
graph_config:
  y_ticks: false
  x_ticks: false
  show_time: true
  show_current: true
  show_highest: true
  y_ticks_position: left
  y_ticks_step_size: 30
  time_step_size: 30
  graph_type: default
font_customize:
  header_font_size: x-large
  header_font_style: capitalize
  header_font_color: ""
  label_font_size: auto
  label_font_style: none
  label_font_color: ""
  hide_label: false
latitude: 50.0874654
longitude: 14.4212535
```

## Contribution Guidelines

We welcome contributions and are grateful for your support in improving this project. If you'd like to contribute, please follow our [Contribution Guidelines](docs/CONTRIBUTING.md) to get started.

---

&copy; 2024 Viet Ngoc

[https://github.com/ngocjohn/](https://github.com/ngocjohn/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!--IMAGES-->
[header-default-card]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-default-view.gif
[no-header-default-card]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/no_header_default.gif
[header-calendar-card]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-header-calendar.gif
[no-header-calendar]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/no_header_calendar.gif
[header-horizon-graph]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-header-horizon-graph.gif
[no-header-horizon-graph]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/no_header_horizon_graph.gif
[no-header-dynamic-graph]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/no_header_dynamic_graph.gif
[header-compact-card]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-compact-view.png
[no-header-compact-card]: https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/no_header_compact.png
[card-config-editor]:https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-config-editor.gif

<!--BADGES-->
[hacs-validate]: https://github.com/ngocjohn/lunar-phase-card/actions/workflows/validate.yaml/badge.svg
[hacs-validate-link]: https://github.com/ngocjohn/lunar-phase-card/actions/workflows/validate.yaml
[total-downloads]: https://img.shields.io/github/downloads/ngocjohn/lunar-phase-card/total?style=flat&logo=homeassistantcommunitystore&logoSize=auto&label=Downloads&color=%2318BCF2
[latest-downloads]:https://img.shields.io/github/downloads/ngocjohn/lunar-phase-card/latest/total?style=flat&logo=homeassistantcommunitystore&logoSize=auto