jsdom = require('jsdom').jsdom
assert = require('power-assert')
sinon = require('sinon')
_ = require('lodash')

SearchableInput = require('../src/scripts/SearchableInput')

items = [{
  name: '現金',
  keywords: ['001', 'genkin', 'げんきん']
}, {
  name: '普通預金',
  keywords: ['002', 'futsuyokin', 'ふつうよきん']
}, {
  name: '定期預金',
  keywords: ['003', 'teikiyokin', 'ていきよきん']
}, {
  name: '受取手形',
  keywords: ['004', 'uketoritegata', 'うけとりてがた']
}, {
  name: '売掛金',
  keywords: ['005', 'urikakekin', 'うりかけきん']
}]

nestedItems = [{
  name: '現金及び預金'
  items: [{
    name: '現金'
    keywords: ['001', 'genkin', 'げんきん']
  }, {
    name: '普通預金',
    keywords: ['002', 'futsuyokin', 'ふつうよきん']
  }, {
    name: '定期預金',
    keywords: ['003', 'teikiyokin', 'ていきよきん']
  }]
}, {
  name: '売上債権',
  items: [{
    name: '受取手形',
    keywords: ['004', 'uketoritegata', 'うけとりてがた']
  }, {
    name: '売掛金',
    keywords: ['005', 'urikakekin', 'うりかけきん']
  }]
}]

mixedItems = [{
  name: '現金',
  keywords: ['001', 'genkin', 'げんきん']
}, {
  name: '普通預金',
  keywords: ['002', 'futsuyokin', 'ふつうよきん']
}, {
  name: '定期預金',
  keywords: ['003', 'teikiyokin', 'ていきよきん']
}, {
  name: '売上債権',
  items: [{
    name: '受取手形',
    keywords: ['004', 'uketoritegata', 'うけとりてがた']
  }, {
    name: '売掛金',
    keywords: ['005', 'urikakekin', 'うりかけきん']
  }]
}]


describe 'SearchableInput', ->
  beforeEach ->
    global.document = jsdom('<html><body></body></html>')
    global.window = document.defaultView
    global.navigator = window.navigator
    global.HTMLElement = window.HTMLElement
    global._ = _

  afterEach ->
    delete global.document
    delete global.window
    delete global.navigator
    delete global.HTMLElement
    delete global._

  describe 'class method', ->
    describe "_searchItems", ->
      it "search in items", ->
        result = SearchableInput._searchItems(items, 'きん')
        assert.deepStrictEqual result, [
          { name: '現金', keywords: [ '001', 'genkin', 'げんきん' ] },
          { name: '普通預金', keywords: [ '002', 'futsuyokin', 'ふつうよきん' ] },
          { name: '定期預金', keywords: [ '003', 'teikiyokin', 'ていきよきん' ] },
          { name: '売掛金', keywords: [ '005', 'urikakekin', 'うりかけきん' ] }
        ]
      it "search in nestedItems", ->
        result = SearchableInput._searchItems(nestedItems, 'きん')
        assert.deepStrictEqual result, [{
          name: '現金及び預金'
          items: [{
            name: '現金'
            keywords: ['001', 'genkin', 'げんきん']
          }, {
            name: '普通預金',
            keywords: ['002', 'futsuyokin', 'ふつうよきん']
          }, {
            name: '定期預金',
            keywords: ['003', 'teikiyokin', 'ていきよきん']
          }]
        }, {
          name: '売上債権',
          items: [{
            name: '売掛金',
            keywords: ['005', 'urikakekin', 'うりかけきん']
          }]
        }]
      it "search in mixedItems", ->
        result = SearchableInput._searchItems(mixedItems, 'きん')
        assert.deepStrictEqual result, [{
            name: '現金',
            keywords: ['001', 'genkin', 'げんきん']
          }, {
            name: '普通預金',
            keywords: ['002', 'futsuyokin', 'ふつうよきん']
          }, {
            name: '定期預金',
            keywords: ['003', 'teikiyokin', 'ていきよきん']
          }, {
            name: '売上債権',
            items: [{
              name: '売掛金',
              keywords: ['005', 'urikakekin', 'うりかけきん']
            }]
          }]

  describe 'instance method', ->
    el = null
    searchableInput = null

    beforeEach ->
      document.querySelector('body').innerHTML = '<div class="searchable-input-container"></div>'
      el = document.querySelector('.searchable-input-container')
      searchableInput = new SearchableInput(el, items)

    afterEach ->
      document.querySelector('body').innerHTML = ''
      el = null
      searchableInput = null

    describe 'render', ->
      it '過不足なくrenderされている(isListShown: false)', ->
        searchableInput._setIsListShown(false)
        searchableInput._render()
        assert.strictEqual(el.querySelectorAll('.searchable-input').length, 1)
        assert.strictEqual(el.querySelectorAll('.js-searchable-input-label').length, 1)
        assert.strictEqual(el.querySelectorAll('input[type="hidden"]').length, 1)
        assert.strictEqual(el.querySelectorAll('.searchable-input-search-input').length, 0)
        assert.strictEqual(el.querySelectorAll('.searchable-input-list').length, 0)
        assert.strictEqual(el.querySelectorAll('.searchable-input-list li').length, 0)
        assert.strictEqual(el.querySelectorAll('.searchable-input-mask').length, 0)

      it '過不足なくrenderされている(isListShown: true)', ->
        searchableInput._setIsListShown(true)
        searchableInput._render()
        assert.strictEqual(el.querySelectorAll('.searchable-input').length, 1)
        assert.strictEqual(el.querySelectorAll('.js-searchable-input-label').length, 1)
        assert.strictEqual(el.querySelectorAll('input[type="hidden"]').length, 1)
        assert.strictEqual(el.querySelectorAll('.searchable-input-search-input').length, 1)
        assert.strictEqual(el.querySelectorAll('.searchable-input-list').length, 1)
        assert.strictEqual(el.querySelectorAll('.searchable-input-list li').length, items.length)
        assert.strictEqual(el.querySelectorAll('.searchable-input-mask').length, 1)

    describe 'handlers', ->
      it '_handleClickLabel', ->
        assert.strictEqual(searchableInput._isListShown, false)
        searchableInput._handleClickLabel()
        assert.strictEqual(searchableInput._isListShown, true)

      it '_handleKeydownSearchInput with ENTER', ->
        searchableInput._show()
        searchableInput._render()
        assert.strictEqual(searchableInput._isListShown, true)
        searchableInput._handleKeydownSearchInput({
          keyCode: 13,
          preventDefault: ->
        })
        assert.strictEqual(searchableInput._isListShown, false)

      it '_handleKeydownSearchInput with TAB', ->
        searchableInput._show()
        searchableInput._render()
        assert.strictEqual(searchableInput._isListShown, true)
        searchableInput._handleKeydownSearchInput({
          keyCode: 9
          preventDefault: ->
        })
        assert.strictEqual(searchableInput._isListShown, false)

      it '_handleKeydownSearchInput with ESC', ->
        searchableInput._show()
        searchableInput._render()
        assert.strictEqual(searchableInput._isListShown, true)
        searchableInput._handleKeydownSearchInput({
          keyCode: 27
          preventDefault: ->
        })
        assert.strictEqual(searchableInput._isListShown, false)

      it '_handleKeydownSearchInput with UP', ->
        searchableInput._show()
        searchableInput._render()
        assert.strictEqual(searchableInput._itemIndex, 0)
        searchableInput._handleKeydownSearchInput({
          keyCode: 38
          preventDefault: ->
        })
        assert.strictEqual(searchableInput._itemIndex, items.length - 1)

      it '_handleKeydownSearchInput with DOWN', ->
        searchableInput._show()
        searchableInput._render()
        assert.strictEqual(searchableInput._itemIndex, 0)
        searchableInput._handleKeydownSearchInput({
          keyCode: 40
          preventDefault: ->
        })
        assert.strictEqual(searchableInput._itemIndex, 1)

      it '_handleClickMask', ->
        searchableInput._show()
        searchableInput._render()
        assert.strictEqual(searchableInput._isListShown, true)
        searchableInput._handleClickMask()
        assert.strictEqual(searchableInput._isListShown, false)

    describe '_show', ->
    describe '_hide', ->
    describe '_decreaseItemIndex', ->
    describe '_increaseItemIndex', ->

    describe '_calcItemLength', ->
      it '正しくlengthが取得できている', ->
        len1 = searchableInput._calcItemLength(items)
        assert.strictEqual(len1, 5)

        len2 = searchableInput._calcItemLength(nestedItems)
        assert.strictEqual(len2, 5)

        len3 = searchableInput._calcItemLength(mixedItems)
        assert.strictEqual(len3, 5)

    describe '_calcItemIndex', ->
      it '正しく初期itemのindexが取得できている', ->
        searchableInput._setItem({name: '受取手形'})

        result1 = searchableInput._calcItemIndex(items, {name: '受取手形'})
        assert.strictEqual(result1, 3)

        result2 = searchableInput._calcItemIndex(nestedItems, {name: '受取手形'})
        assert.strictEqual(result2, 3)

        result3 = searchableInput._calcItemIndex(mixedItems, {name: '受取手形'})
        assert.strictEqual(result3, 3)

    describe '_findItemByIndex', ->
      it '正しくitemがindexから取得できている', ->
        result1 = searchableInput._findItemByIndex(items, 3).item
        assert.strictEqual(result1.name, '受取手形')

        result2 = searchableInput._findItemByIndex(nestedItems, 3).item
        assert.strictEqual(result2.name, '受取手形')

        result3 = searchableInput._findItemByIndex(mixedItems, 3).item
        assert.strictEqual(result3.name, '受取手形')

    describe 'updateItem', ->
      it '正しく更新されselectイベントは起きずにchangeイベントが必要に応じて発火している', ->
        stubSelect = sinon.stub()
        stubChange = sinon.stub()
        searchableInput.on 'select', stubSelect
        searchableInput.on 'change', stubChange

        searchableInput.updateItem({name: '普通預金'})
        item = searchableInput.getSelectedItem()
        assert.deepStrictEqual(item, {name: '普通預金'})
        assert.strictEqual(stubSelect.callCount, 0)
        assert.strictEqual(stubChange.callCount, 1)

        searchableInput.updateItem({name: '普通預金'})
        item = searchableInput.getSelectedItem()
        assert.deepStrictEqual(item, {name: '普通預金'})
        assert.strictEqual(stubSelect.callCount, 0)
        assert.strictEqual(stubChange.callCount, 1)

    describe 'updateItems', ->
      it 'itemsを変更し、changeItemsイベントを発火する', ->
        stubSelect = sinon.stub()
        stubChange = sinon.stub()
        stubChangeItems = sinon.stub()
        searchableInput.on 'select', stubSelect
        searchableInput.on 'change', stubChange
        searchableInput.on 'changeItems', stubChangeItems

        searchableInput._setItem({name: '普通預金'})
        searchableInput.updateItems(nestedItems)
        item = searchableInput.getSelectedItem()
        assert.deepStrictEqual(item, {name: '現金'})
        assert.strictEqual(stubChange.callCount, 0)
        assert.strictEqual(stubSelect.callCount, 0)
        assert.strictEqual(stubChangeItems.callCount, 1)

    describe 'updateItems', ->

  describe 'instance method(stubあり)', ->
    el = null
    searchableInput = null

    handleClickLabel = null
    handleKeydownSearchInput = null
    handleKeyupSearchInput = null
    handleClickMask = null
    handleClickListItem = null

    beforeEach ->
      handleClickLabel = sinon.stub(SearchableInput.prototype, '_handleClickLabel')
      handleKeydownSearchInput = sinon.stub(SearchableInput.prototype, '_handleKeydownSearchInput')
      handleKeyupSearchInput = sinon.stub(SearchableInput.prototype, '_handleKeyupSearchInput')
      handleClickMask = sinon.stub(SearchableInput.prototype, '_handleClickMask')
      handleClickListItem = sinon.stub(SearchableInput.prototype, '_handleClickListItem')

      document.querySelector('body').innerHTML = '<div class="searchable-input-container"></div>'
      el = document.querySelector('.searchable-input-container')
      searchableInput = new SearchableInput(el, items)

    afterEach ->
      SearchableInput.prototype._handleClickLabel.restore()
      SearchableInput.prototype._handleKeydownSearchInput.restore()
      SearchableInput.prototype._handleKeyupSearchInput.restore()
      SearchableInput.prototype._handleClickMask.restore()
      SearchableInput.prototype._handleClickListItem.restore()

    describe 'イベントハンドラ', ->
      it 'listが非表示時にイベントハンドラが正しく設定されている', ->
        label = el.querySelector('.js-searchable-input-label')
        input = el.querySelector('.searchable-input-search-input')
        mask = el.querySelector('.searchable-input-mask')
        listItems = el.querySelectorAll('.searchable-input-list-item')

        label.dispatchEvent(new window.Event('click'))
        assert.strictEqual(handleClickLabel.callCount, 1)

        assert.strictEqual(input, null)
        assert.strictEqual(mask, null)
        assert.strictEqual(listItems.length, 0)

      it 'listが表示時にイベントハンドラが正しく設定されている', ->
        searchableInput._setIsListShown(true)
        searchableInput._render()

        label = el.querySelector('.js-searchable-input-label')
        input = el.querySelector('.searchable-input-search-input')
        mask = el.querySelector('.searchable-input-mask')
        listItems = el.querySelectorAll('.searchable-input-list-item')

        label.dispatchEvent(new window.Event('click'))
        assert.strictEqual(handleClickLabel.callCount, 1)

        input.dispatchEvent(new window.Event('keydown'))
        assert.strictEqual(handleKeydownSearchInput.callCount, 1)

        input.dispatchEvent(new window.Event('keyup'))
        assert.strictEqual(handleKeyupSearchInput.callCount, 1)

        mask.dispatchEvent(new window.Event('click'))
        assert.strictEqual(handleClickMask.callCount, 1)

        for listItem, index in listItems
          listItem.dispatchEvent(new window.Event('click'))
        assert.strictEqual(handleClickListItem.callCount, listItems.length)

    describe '外部へのイベント', ->
      it '過不足なくイベントが発火するか', ->
        stubSelect = sinon.stub()
        stubChange = sinon.stub()
        searchableInput.on 'select', stubSelect
        searchableInput.on 'change', stubChange

        item = searchableInput.getSelectedItem()
        assert.deepStrictEqual(item, {name: '現金'})

        searchableInput._dispatchEvents({name: '現金'})
        item = searchableInput.getSelectedItem()
        assert.strictEqual(stubSelect.callCount, 1)
        assert.strictEqual(stubChange.callCount, 0)

        searchableInput._dispatchEvents({name: '普通預金'})
        item = searchableInput.getSelectedItem()
        assert.strictEqual(stubSelect.callCount, 2)
        assert.strictEqual(stubChange.callCount, 1)

      it 'payloadにitemが入っているか', ->
        searchableInput.on 'select', (payload) ->
          assert.deepStrictEqual(payload, {item: {name: '普通預金'}})
        searchableInput.on 'change', (payload) ->
          assert.deepStrictEqual(payload, {item: {name: '普通預金'}})

        item = searchableInput.getSelectedItem()
        assert.deepStrictEqual(item, {name: '現金'})

        searchableInput._setItem({name: '普通預金'})
