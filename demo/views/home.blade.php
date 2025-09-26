@include('partials.header')

<main>
    <section class="uk-section uk-section-default">
        <div class="uk-container">
            <h1 class="uk-heading-line uk-text-center"><span>UIkit Live Search Demo</span></h1>
            <p class="uk-text-lead uk-text-center">
                Welcome to the demo of the <a href="https://github.com/gdmk93/uikit-live-search" target="_blank">uikit-live-search</a> component for the <a href="https://getuikit.com" target="_blank">UIkit JS framework</a>!
            </p>
            <p class="uk-text-center">
                This demo showcases a dynamic search interface powered by <code>uikit-live-search</code>. Search for characters, buildings, items, and events from the <strong>SpongeBob SquarePants</strong> universe using the search bar in the navbar above.
            </p>
            <div class="uk-text-center uk-margin">
                <span class="uk-text-muted">Try searching for "SpongeBob", "Krusty Krab", "Jellyfishing", or "Krabby Patty"!</span>
            </div>
            <div class="uk-text-center uk-margin">
                <a href="/pages" class="uk-button uk-button-primary">Browse All Items</a>
            </div>
        </div>
    </section>
</main>

@include('partials.footer')