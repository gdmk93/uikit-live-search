<article class="uk-card uk-card-small uk-card-default">
    <div class="uk-card-media-top">
        <img src="/views/images/image.webp" alt="">
    </div>

    <div class="uk-card-header">
        <h2 class="uk-card-title uk-margin-remove-bottom">
            <a href="/page/{{ $slug }}" class="uk-link-reset">{{ $name }}</a>
        </h2>
        <p class="uk-text-meta uk-margin-remove-top">{{ $type }}</p>
    </div>

    <div class="uk-card-body">
        <p>{{ $description }}</p>
    </div>

    <div class="uk-card-footer">
        <a href="/page/{{ $slug }}" class="uk-button uk-button-text">Read more</a>
    </div>
</article>