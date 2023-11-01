![Illustration of a retro car's dashboard. The radio dial is turned to a station labeled 'Keyword Classic'. The scene outside the car window reveals a vast desert landscape, cacti, and a setting sun, reminiscent of classic road trip adventures. DALL-E 3](./dashboard.png)

# Keyword Classic

Extracts keywords from a document using some classic NLP methods:

- **Textrank:** Weighted Textrank over NGrams ([paper][textrank])
- **NGrams:** Basic frequency-based NGrams ([compromise][compromise])
- **TF-IDF:** Each sentence is considered a document ([compromise][compromise])

## Usage

```sh
deno run -A src/kwd_classic.ts path/to/file.md -l 10 -a all > keywords.json
```

## Testing

```sh
deno test -A
```

[textrank]: https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf
[compromise]: https://github.com/spencermountain/compromise/tree/master