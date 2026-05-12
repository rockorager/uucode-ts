# uucode-ts

TypeScript port of [`jacobsandlund/uucode`](https://github.com/jacobsandlund/uucode).

The package has no runtime dependencies. Unicode tables are generated from the
checked-in Unicode Character Database files during `npm run build`.

```ts
import { get, getProperties, graphemes, stringWidth } from "uucode-ts";

get("general_category", 0x2200); // "symbol_math"
get("simple_uppercase_mapping", 0x03c2); // 0x03a3
getProperties(0x1f600).is_emoji_presentation; // true
stringWidth("ò👨🏻‍❤️‍👨🏿_"); // 4

for (const segment of graphemes("👩🏽‍🚀🇨🇭")) {
  console.log(segment);
  // { segment: "👩🏽‍🚀", start: 0, end: 7 }
  // { segment: "🇨🇭", start: 7, end: 11 }
}
```

Focused entry points are also available:

```ts
import * as ascii from "uucode-ts/ascii";
import { graphemes } from "uucode-ts/grapheme";
import { getBoolean } from "uucode-ts/properties";
import { stringWidth } from "uucode-ts/width";
```

## Development

```sh
npm install
npm test
npm run benchmark
```
