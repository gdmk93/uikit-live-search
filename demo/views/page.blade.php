@include('partials.header')

<main>
    <article>
        <header>
            <h1 class="uk-heading-bullet">{{ $name }}</h1>
            <p class="uk-text-meta">{{ $type }}</p>
        </header>

        <p>{{ $description }}</p>
    </article>
</main>

@include('partials.footer')