@unless ($isLiveSearch)
    @include('partials.header')
@endunless

<main>
    <section>
        @unless ($isLiveSearch)
            <header>
                <h1 class="uk-heading-bullet">Search result</h1>
                <p class="uk-text-meta">For query <strong>"{{ $q }}"</strong>, in tab <strong>"{{ $currentTab }}"</strong></p>
            </header>
        @endunless

        <div class="uk-padding-small uk-position-relative uk-position-z-index uk-background-default uk-box-shadow-medium">
            <ul class="uk-subnav uk-subnav-pill uk-margin-remove-bottom">
                @foreach ($tabs as $tab)
                    <li @class(['uk-active' => $tab === $currentTab])>
                        <a
                            @if ($isLiveSearch)
                                href="#"
                                uk-live-search-command='search {{ $tab === $defaultTab ? '{}' : json_encode(["tab" => $tab]) }}'
                            @else
                                href="/search?{{ http_build_query(['q' => $q, 'tab' => $tab]) }}"
                            @endif
                        >
                            {{ $tab }}
                        </a>
                    </li>
                @endforeach
            </ul>
        </div>

        <div @class(['uk-padding-small', 'uk-padding-remove-horizontal' => !$isLiveSearch])>
            <div @class(['uk-grid-small uk-child-width-1-2', 'uk-child-width-1-3@m' => !$isLiveSearch]) uk-grid="masonry: next;">
                @if (count($items))
                    @foreach ($items as $item)
                        <div>
                            @include('partials.card', $item)
                        </div>
                    @endforeach
                @else
                    <div @class(['uk-width-1-1 uk-text-muted', 'uk-text-center' => $isLiveSearch])>
                        <p>
                            No items found<span>@if ($isLiveSearch), for query <strong>"{{ $q }}"</strong>, in tab <strong>"{{ $currentTab }}"</strong>@endif</span>
                        </p>
                    </div>
                @endif
            </div>
        </div>
    </section>
</main>

@unless ($isLiveSearch)
    @include('partials.footer')
@endunless