@verbatim
    <template id="uk-live-search-template">
        <div class="uk-padding">
            {{ unless isError }}
                {{ if history }}
                    <ul class="uk-nav uk-dropdown-nav uk-margin-bottom">
                        <li class="uk-nav-header uk-flex uk-flex-middle uk-flex-between">
                            <span>History</span>
                            <a href="#" uk-live-search-command="history.clear" style="text-transform: none">Clear</a>
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
                            <li class="uk-flex uk-flex-middle">
                                <a href="#" class="uk-width-expand" uk-live-search-command="search:focus {{= item.name | escape }}">
                                    <div>
                                        <span class="uk-text-truncate">{{= item.name | escape }}</span>
                                        <span class="uk-nav-subtitle uk-display-block">{{= item.type | escape }}</span>
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
@endverbatim