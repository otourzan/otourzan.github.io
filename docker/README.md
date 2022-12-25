

### Buid

```shell
npm run build
```

### Build w/o minify

Comment out the following block in rollup.config.js
```
    terser({
       ecma: 2020,
       module: true,
       warnings: true,
    }),
```

### Publish

```shell
rollup -c
```