@include('partials.header')

<main>
    <section>
        <header>
            <h1 class="uk-heading-bullet">Pages</h1>
        </header>

        <div class="uk-grid-small uk-child-width-1-2 uk-child-width-1-3@m" uk-grid="masonry: next;">
            @foreach ($items as $item)
                <div>
                    @include('partials.card', $item)
                </div>
            @endforeach
        </div>
    </section>
</main>

@include('partials.footer')