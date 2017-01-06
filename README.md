# searchable-input

![](/docs/demo.gif)


## Feature
- It is a UI library like [Select2](https://select2.github.io/).
- It is made of vanilla JS.


## Getting Started
### Use directly
- Copy [searchable-input.js](https://github.com/khirayama/searchable-input/raw/npm-publish/pkg/searchable-input.js) and
  [searchable-input.css](https://raw.githubusercontent.com/khirayama/searchable-input/npm-publish/pkg/searchable-input.css).
- Paste into your app.

### Use via Node.js/npm
```bash
npm install --save searchable-input
```

```js
const SearchableInput = require('searchable-input');
```


## Usage
### Basic usage
```js
var searchableInputItems = [{
  name: '現金および預金',
  items: [{
    id: 0,
    name: '現金',
    keywords: ['genkin'],
  }, {
    id: 1,
    name: '当座預金',
    keywords: ['tozayokin'],
  }, {
    id: 2,
    name: '普通預金',
    keywords: ['futsuyokin'],
  }, {
    id: 3,
    name: '定期預金',
    keywords: ['teikiyokin'],
  }],
}, {
  name: '売上債権',
  items: [{
    id: 4,
    name: '受取手形',
    keywords: ['uketoritegata'],
  }, {
    id: 5,
    name: '売掛金',
    keywords: ['urikakekin'],
  }],
}];

// input[hidden]のnameをitem_id、
// input[hidden]にセットする値をitem.idにしたい場合
var searchableInput = new SearchableInput(
  document.querySelector('.js-searchable-input'),
  searchableInputItems,
  {
    inputName: 'item_id',
    inputValueKey: 'id'
  }
);

// 選択されたことを検知したい場合（valueが変更されなくても発火する）
searchableInput.on('select', function(value) {
  console.log(value);
});

// 変更を検知したい場合
searchableInput.on('change', function(value) {
  console.log(value);
});
```

### Generate from select element
```html
<select class="js-select-applied-searchable-input" name="select_applied_searchable_input">
  <option value="1">ITEM 1</option>
  <option value="2" data-keywords='["item two","item ni"]'>ITEM 2</option>
  <optgroup label="ITEM GROUP 1">
    <option value="3">ITEM 3</option>
    <option value="4">ITEM 4</option>
  </optgroup>
  <optgroup label="ITEM GROUP 2">
    <option value="5">ITEM 5</option>
    <option value="6">ITEM 6</option>
  </optgroup>
</select>
```

```js
new SearchableInput(document.queryselector('.js-select-applied-searchable-input'));
```

- `data-keywords` attribute requires `JSON.stringify`-ed string as a HTML attribute.


## API Document
### `new SearchableInput()`
```js
/**
 * @param {HTMLElement} el - 適用するHTML要素。
 *                           第一引数のHTML要素がselect要素の場合、第二引数以降は不要である。
 * @param {(Array<{ id, name, keywords, items }>|undefined)} items
 *   検索候補の一覧、name 必須で id もしくは items のどちらかが必須。
 *   {string} name       = 表示項目名、絞り込み対象のキーワードにも含まれる。
 *   {string} [id]       = 選択時の値として使われる。
 *                         特に空の値を設定したい場合は、null や undefined` ではなく '' (空文字) 指定する。
 *   {string} [keywords] = 絞り込み対象のキーワードリスト、いずれかに部分一致で真となる。
 *   {array}  [items]    = この構造をネストできる。
 * @param {(Object|undefined)} options
 * @param {string} [options.inputName] - formにも対応するためinput[hidden]要素を持っているが、そのinput要素のname属性にセットする値
 *                                        (default: el.getAttribute('name') || 'name')
 * @param {string} [optios.inputValueKey] - input[hidden]要素のvalueにセットする値のkey。
 *                                          例えばitem.idをセットしたい場合は{ inputValueKey: 'id' }とすればよい。
 *                                          (default: 'name')
 * @param {Object} [optios.initialItem] - 初期値にセットしたいitemをセットする。
 *                                        パラメータは items 引数の 1 要素と同様。
 */
class SearchableInput {
  constructor(el, items, optios) {
  }
}
```

### Instance Methods
- `updateItem(item)`: 選択中の項目を変更する。引数の `item` は `{ name, inputValueKeyで指定したキー }`。
- `updateItems(items)`: 項目リストを変更する。

### Events
```js
/**
 * @fires SearchableInput#select       値を選択した場合に発火する。
 *                                     (値が変更されないときも発火する。またchangeイベントの前に発火する。）
 * @fires SearchableInput#change       値が変更された場合に発火する。
 * @fires SearchableInput#change.items items を更新した場合に発火する。
 *                                     (このときvalueが変わってもchangeイベントは発火しない。)
 */
```


## Development
### Preparation
- Install the [Node.js](https://nodejs.org) `>=6.8 <7`
- Install the [yarnpkg](https://yarnpkg.com)

### Installation
```bash
yarn install
```


## Release Flow
```bash
npm run prepare-release
git add ./pkg
git ci ./pkg
npm version {patch|minor|major}
npm publish
git push --tags
```
