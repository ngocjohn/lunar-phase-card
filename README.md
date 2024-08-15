<a name="readme-top"></a>
[![HACS](https://github.com/ngocjohn/lunar-phase-card/actions/workflows/validate.yaml/badge.svg)](https://github.com/ngocjohn/lunar-phase-card/actions/workflows/validate.yaml) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/ngocjohn/lunar-phase-card/total?style=flat&logo=homeassistantcommunitystore&logoSize=auto&label=Downloads&color=%2318BCF2) ![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/ngocjohn/lunar-phase-card/latest/total?style=flat&logo=homeassistantcommunitystore&logoSize=auto)

# 🌘 Lunar Phase Card

<img src="https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/header.gif" style="border-radius: 8px" />

##

<p style="text-align: justify;">This is a Lovelace custom card for Home Assistant that provides detailed information about the current phase of the moon. This card leverages precise astronomical calculations to deliver accurate lunar data, making it a valuable addition for those interested in astronomy, astrology, or just tracking the moon's phases.</p>

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

| Language Code | Language (Native Name) |
| ------------- | ---------------------- |
| `cs.json`     | Čeština                |
| `en.json`     | English                |

</details>

### Default & Compact view

<div style="display: flex; justify-content: space-between; gap: 0.5rem;">
  <img src="https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-default.png" alt="Lunar Phase Cards" width="48%" >
  <img src="https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/lunar-compact.png" alt="Lunar Phase Calendar" width="48%" >
</div>

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

## Installation

### [HACS](https://hacs.xyz) (Home Assistant Community Store)

1. Go to HACS page on your Home Assistant instance
2. Add this repository via HACS Custom repositories [How to add Custom Repositories](https://hacs.xyz/docs/faq/custom_repositories/)

```
https://github.com/ngocjohn/lunar-phase-card
```

3. Select `Lovelace`
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

<p align="center">
  <a href="./assets/card-ui-editor.gif">
    <img src="https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/main/assets/ui-editor.gif" alt="Card UI Editor">
  </a>
</p>

| Name                | Type    | Requirement | Description                                                           |
| ------------------- | ------- | ----------- | --------------------------------------------------------------------- |
| `type`              | string  | Required    | The type of the card. For this card, use `custom:lunar-phase-card`.   |
| `entity`            | string  | Optional    | The entity_id from Lunar Phase custom component `sensor.*_moon_phase` |
| `use_system`        | boolean | Optional    | Whether to use default settings. Defaults to `true`.                  |
| `use_entity`        | boolean | Optional    | Whether to use entity settings. Defaults to `false`.                  |
| `use_custom`        | boolean | Optional    | Whether to use custom settings. Defaults to `false`.                  |
| `show_background`   | boolean | Optional    | Whether to show the background image. Defaults to `false`.            |
| `compact_view`      | boolean | Optional    | Whether to display the card in a compact view. Defaults to `false`.   |
| `12hr_format`       | boolean | Optional    | Whether to display time in 12-hour format. Defaults to `false`.       |
| `custom_background` | string  | Optional    | URL of a custom background image for the card.                        |
| `selected_language` | string  | Optional    | ISO code of the language to be used. Defaults to system or `en`.      |
| `latitude`          | number  | Optional    | The latitude for which to calculate the lunar phase.                  |
| `longitude`         | number  | Optional    | The longitude for which to calculate the lunar phase.                 |

> [!NOTE]
> The `entity` parameter is not required. It refers to the entity ID from the Lunar Card Custom component, which can be installed [here](https://github.com/ngocjohn/lunar-phase). If the `entity` is not defined, the card will use the default latitude and longitude from the system configuration.

### Example Configuration

Here's an example configuration for the Lunar Phase Card:

```yaml
type: custom:lunar-phase-card
entity: sensor.your_moon_phase_sensor
use_system: true
use_entity: false
use_custom: false
show_background: true
compact_view: true
12hr_format: false
custom_background: '/local/images/moon_background.jpg'
selected_language: 'en'
latitude: 48.8566
longitude: 2.3522
```

## Contribution Guidelines

We welcome contributions and are grateful for your support in improving this project. If you'd like to contribute, please follow our [Contribution Guidelines](docs/CONTRIBUTING.md) to get started.

---

&copy; 2024 Viet Ngoc

[https://github.com/ngocjohn/](https://github.com/ngocjohn/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
