# UIkit Live Search Component

A lightweight and flexible tool for implementing live search and navigation within your interface, built with **Vanilla JavaScript** for easy integration and no external dependencies.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Configuration Parameters](#configuration-parameters)
- [Commands](#commands)
  - [search](#search)
  - [input.clear](#inputclear)
  - [history.clear](#historyclear)
  - [history.remove](#historyremove)
- [Input Field Behavior](#input-field-behavior)
- [Request Behavior](#request-behavior)
  - [Standard Submit](#standard-submit)
  - [Live Search](#live-search)
- [Template Engine](#template-engine)
  - [Syntax](#syntax)
  - [Basic Template Example](#basic-template-example)
- [License](#license)

## Overview
The UIkit Live Search component enables dynamic search and navigation in your interface. Built on pure JavaScript, it is lightweight, dependency-free, and highly customizable through HTML attributes and a minimalistic templating engine inspired by Blade and Antlers.

## Quick Start
To integrate the Live Search component, include the form, template, and initialize UIkit. Below is a minimal example:

```html
<form id="live-search" action="/search" uk-live-search class="uk-search uk-search-navbar uk-width-large">
    <input name="q" class="uk-search-input" type="search" placeholder="Search" aria-label="Search">
    <div class="uk-position-center-right uk-flex uk-flex-middle">
        <div uk-spinner="ratio: 0.6;" class="uk-margin-small-right"></div>
        <button uk-live-search-command="input.clear:focus" type="button" class="uk-live-search-control uk-margin-small-right" uk-icon="close"></button>
        <button type="submit" class="uk-live-search-control uk-margin-small-right" uk-icon="search"></button>
    </div>
    <div id="uk-live-search-result" uk-dropdown="toggle: false; mode: click;" class="uk-height-max-large uk-padding-remove"></div>
</form>

<template id="uk-live-search-template">
    <!-- Template content -->
</template>
```

> **Note**: The `uk-dropdown` attribute must include `toggle: false; mode: click;` to ensure proper dropdown behavior with Live Search.

## Key Features
- **Advanced Logic**: Supports tabs, search history, popular queries, autocomplete, and custom navigation.
- **Efficient Requests**: Automatically filters duplicate requests, with a `force` modifier for manual overrides.
- **Vanilla JS**: No dependencies, ensuring lightweight and fast performance.
- **Flexible Templating**: Minimalistic templating engine for conditions, loops, and data output in HTML.
- **Simple Integration**: Controlled via HTML attributes, requiring minimal JavaScript.
- **UX-First Design**: Prioritizes user experience with responsive, predictable behavior and no unnecessary reloads.

## Configuration Parameters
The component supports the following parameters (see [UIkit documentation](https://getuikit.com/docs/javascript) for details):

| Parameter             | Type              | Default                              | Description                                                                 |
|-----------------------|-------------------|--------------------------------------|-----------------------------------------------------------------------------|
| `selInput`            | String            | `'input[type="search"]'`            | Selector for the main search input.                                         |
| `selSpinner`          | String            | `'.uk-spinner'`                     | Selector for the loading indicator.                                         |
| `selControl`          | String            | `'.uk-live-search-control'`         | Selector for control elements (e.g., clear button). Visible when input has value. |
| `selTrackLink`        | String            | `'a[href]:not([href=""], [href="#"])'` | Selector for trackable links in the target, logged in history on click.     |
| `template`            | String            | `'#uk-live-search-template'`        | Selector for the template used to render results, history, and popular queries. |
| `attrName`            | String            | `'uk-live-search-command'`          | Attribute containing component commands.                                    |
| `historyStorageKey`   | String            | `'live-search'`                     | Key for storing search history in `localStorage`.                           |
| `historyLimit`        | Number            | `50`                                | Maximum number of history items. Older items are overwritten.               |
| `historyDisplayLimit` | Number            | `10`                                | Maximum history items passed to the template.                               |
| `popular`             | String \| Boolean | `false`                             | Popular queries (comma-separated string or JSON array of strings/objects).  |
| `timeout`             | Number            | `10000` (10 seconds)                | Request timeout; cancels if exceeded and renders an error.                  |
| `cache`               | Boolean           | `true`                              | Enables/disables result caching.                                           |
| `caseInsensitive`     | Boolean           | `true`                              | Toggles case sensitivity for searches.                                      |

**Example**:
```html
<button uk-live-search-command="input.clear"></button>
<a uk-live-search-command='search {"q":"Hello World!"}'></a>
```

## Commands
Commands are defined using the HTML attribute specified in `attrName`. Add `tabindex` to non-link elements for keyboard accessibility.

### search
Performs a search, accepting a JSON object or string. Non-JSON values are treated as strings for the search input.

**Examples**:
```html
<a uk-live-search-command='search { "tab": "books" }'>Books</a>
<a uk-live-search-command="search Hello World!">Search text</a>
```

If the JSON object contains a key matching the input’s `name` (e.g., `q`), that value is assigned to the input.

> **Important**: When rendering history in templates, use the `json` modifier to safely handle JSON strings:
> ```html
> <a uk-live-search-command='search {{= value | json | escape }}'>...</a>
> ```

#### Modifiers
- `focus`: Sets focus on the search input.
  ```html
  <a uk-live-search-command="search:focus Hello World!">...</a>
  ```
- `debounce.<ms>`: Delays execution by the specified milliseconds.
  ```html
  <a uk-live-search-command="search:debounce.400 Hello World!">...</a>
  ```
- `force`: Forces execution, bypassing duplicate request filtering.
  ```html
  <a uk-live-search-command='search:force { "tab": "news" }'>Reload</a>
  ```
- `merge`: Merges current command parameters with the previous ones.
  ```html
  <a uk-live-search-command='search:merge { "tab": "articles" }'>Articles</a>
  ```

### input.clear
Clears the search input and resets results, typically showing history/popular queries if defined.
```html
<a uk-live-search-command="input.clear">Clear</a>
```

### history.clear
Clears the entire search history.
```html
<a uk-live-search-command="history.clear">Clear history</a>
```

### history.remove
Removes a specific history item (string, no escaping needed).
```html
<a uk-live-search-command="history.remove Hello World!">Remove</a>
```

## Input Field Behavior
If no `uk-live-search-command` is specified for the input, it defaults to:
```
search:merge:debounce.400 {}
```
- `search`: Triggers a search.
- `merge`: Merges new parameters with previous ones (e.g., for tabs/filters).
- `debounce.400`: Delays execution by 400ms to avoid excessive requests.
- `{}`: Empty object, extendable for additional parameters.

**Override Example**:
```html
<input name="q" uk-live-search-command='search:debounce.400 {"source":"navbar"}'>
```

## Request Behavior
### Standard Submit
The form submits normally, redirecting to the results page with all form parameters and the latest command’s parameters.

### Live Search
Dynamic AJAX requests include a `live-search: true` flag to differentiate from standard submits.

## Template Engine
Inspired by Blade and Antlers, the lightweight templating engine supports:
- Data output with modifiers (`escape`, `json`).
- Conditional statements (`if`, `unless`, `else`).
- Loops (`each`).
- Automatic whitespace cleanup (except in `<pre>` tags).

### Syntax
#### Data Output
```handlebars
{{= variable }}
{{= variable | modifier1 | modifier2 }}
```
- `escape`: Escapes HTML.
- `json`: Serializes to JSON string.

**Example**:
```handlebars
<span>{{= username | escape }}</span>
<pre>{{= searchParams | json }}</pre>
```

#### Conditionals
```handlebars
{{ if variable }}
    ... content ...
{{ else variable }}
    ... alternative ...
{{ /if variable }}
```
```handlebars
{{ unless variable }}
    ... content ...
{{ else variable }}
    ... alternative ...
{{ /unless variable }}
```

**Example**:
```handlebars
{{ if isTimeout }}
    <p>Request timed out.</p>
{{ else isTimeout }}
    <p>Network error or server unavailable.</p>
{{ /if isTimeout }}
```

#### Loops
```handlebars
{{ each collection as value }}
    {{= value }}
{{ /each collection }}
```
```handlebars
{{ each collection as value, key }}
    {{= key }}: {{= value }}
{{ /each collection }}
```

**Example**:
```handlebars
{{ each history as value }}
    <li>{{= value | escape }}</li>
{{ /each history }}
```

### Basic Template Example
```html
<template id="uk-live-search-template">
    <div class="uk-padding">
        {{ unless isError }}
            {{ if history }}
                <ul class="uk-nav uk-dropdown-nav uk-margin-bottom">
                    <li class="uk-nav-header uk-flex uk-flex-between">
                        <span>History</span>
                        <a href="#" uk-live-search-command="history.clear">Clear</a>
                    </li>
                    <li class="uk-nav-divider"></li>
                    {{ each history as value }}
                        <li class="uk-flex uk-flex-middle">
                            <a href="#" class="uk-width-expand" uk-live-search-command="search:focus {{= value | json | escape }}">
                                <span class="uk-text-truncate">{{= value | escape }}</span>
                            </a>
                            <a href="#" uk-live-search-command="history.remove {{= value | escape }}" uk-icon="close"></a>
                        </li>
                    {{ /each history }}
                </ul>
            {{ /if history }}
            {{ if popular }}
                <ul class="uk-nav uk-dropdown-nav">
                    <li class="uk-nav-header">Popular</li>
                    <li class="uk-nav-divider"></li>
                    {{ each popular as item }}
                        <li>
                            <a href="#" class="uk-width-expand" uk-live-search-command="search:focus {{= item.name | escape }}">
                                <div>
                                    <span class="uk-text-truncate">{{= item.name | escape }}</span>
                                    <span class="uk-nav-subtitle">{{= item.type | escape }}</span>
                                </div>
                            </a>
                        </li>
                    {{ /each popular }}
                </ul>
            {{ /if popular}}
        {{ else isError }}
            <p>Search parameters: <pre>{{= searchParams | json }}</pre></p>
            <p>An error occurred!</p>
            {{ if isTimeout }}
                <p>The server did not respond in time. Timeout: {{= timeout }} ms.</p>
            {{ else isTimeout }}
                <p>It looks like there was a network error or the server is unavailable.</p>
            {{ /if isTimeout }}
            <button type="button" class="uk-button uk-button-primary uk-width-1-1" uk-live-search-command="{{= command | escape }}">Try again</button>
        {{ /unless isError }}
    </div>
</template>
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

> **Note**: Documentation was prepared with assistance from Grok AI.
