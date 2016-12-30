EventEmitter = require('events').EventEmitter

TAB_KEYCODE = 9
ENTER_KEYCODE = 13
ESC_KEYCODE = 27
UP_KEYCODE = 38
DOWN_KEYCODE = 40

uniq = (arr) ->
  ret = []
  i = 0
  while i < arr.length
    if ret.indexOf(arr[i]) == -1
      ret.push arr[i]
    i++
  ret

class SearchableInput extends EventEmitter
  @_searchItems = (items, searchwords) ->
    searchedItems = []
    tmp = []
    searchwords_ = searchwords.replace(new RegExp('　', 'g'), ' ').split(' ')

    items.forEach (item) ->
      # 末端の場合
      if !item.items
        searchwords_.forEach (keyword_) ->
          return if keyword_ == '' && searchwords_.length > 1
          items.forEach (item_) ->
            if item_.name.toUpperCase().indexOf(keyword_.toUpperCase()) != -1
              if !item_.items
                tmp.push(item_)

            if item_.keywords
              item_.keywords.forEach (keyword) ->
                # FIXME: orマッチになっている andマッチのほうがよいように思うのだが
                if keyword.toUpperCase().indexOf(keyword_.toUpperCase()) != -1
                  tmp.push(item_)

          searchedItems = tmp.concat()
          tmp = []
      else
        tmp = SearchableInput._searchItems(item.items, searchwords)

        # tmpの長さがない場合、親itemが不要
        if tmp.length != 0
          searchedItems.push
            name: item.name
            items: tmp

      return searchedItems
    return uniq(searchedItems)

  @_getInitialItem = (items) ->
    if items[0].items
      SearchableInput._getInitialItem(items[0].items)
    else
      items[0]

  @selectElementSerialize = (selectElement) ->
    itemElements = selectElement.querySelectorAll('select > option, select > optgroup')
    # optgroupがoptgroupを持つことができないため
    # ネストした状態を考慮する必要がない
    items = []
    _retrieveKeywords = (optionElement) ->
      keywords = optionElement.getAttribute('data-keywords')
      if keywords
        JSON.parse(keywords)
      else
        []

    for itemElement in itemElements
      if itemElement.tagName == 'OPTION'
        item =
          name: itemElement.text.trim()
          value: itemElement.value
        item.keywords = _retrieveKeywords(itemElement)
        items.push(item)
      if itemElement.tagName == 'OPTGROUP'
        items.push({
          name: itemElement.label
          items: []
        })
        optionElements = itemElement.querySelectorAll('optgroup > option')
        for optionElement in optionElements
          item =
            name: optionElement.text.trim()
            value: optionElement.value
          item.keywords = _retrieveKeywords(optionElement)
          items[items.length - 1].items.push(item)
    return items

  @selectElementOptionSerialize = (selectElement) ->
    return {
      inputName: selectElement.name
      inputValueKey: 'value'
    }

  constructor: (@_el, @_items = [], options = {}) ->
    super()
    if !(@_el instanceof HTMLElement)
      console.error('Invalid argument passed. First argument is not HTMLElement and might be jQuery object. ')
    else if @_el.tagName == 'SELECT'
      @_items = SearchableInput.selectElementSerialize(@_el)
      options = SearchableInput.selectElementOptionSerialize(@_el)

      initialItem =
        name: @_el.querySelector('option:checked').text.trim()
        value: @_el.value

      newEl = document.createElement('div')
      newEl.id = @_el.id
      newEl.className = @_el.className
      @_el.parentNode.replaceChild(newEl, @_el)
      @_el = newEl

    initialItem = initialItem || options.initialItem || SearchableInput._getInitialItem(@_items)

    # option values
    @_inputName = options.inputName || @_el.getAttribute('name') || 'name'
    @_inputValueKey = options.inputValueKey || 'name'

    @_labelValue = initialItem.name
    @_inputValue = initialItem[@_inputValueKey]

    @_itemIndex = 0
    @_searchedItems = SearchableInput._searchItems(@_items, '')
    @_isListShown = false

    @_el.classList.add('searchable-input-container')
    @_render()

  # accesser
  _getItem: () ->
    item =
      name: @_labelValue
    item[@_inputValueKey] = @_inputValue
    item

  _setItem: (item) ->
    @_labelValue = item.name
    @_inputValue = item[@_inputValueKey]

  _setIsListShown: (isListShown) ->
    @_isListShown = isListShown

  _setItemIndex: (itemIndex) ->
    @_itemIndex = itemIndex

  _setSearchedItems: (searchedItems) ->
    @_searchedItems = searchedItems

  _isChange: (prevItem) ->
    !(prevItem.name == @_labelValue && prevItem[@_inputValueKey] == @_inputValue)

  _dispatchSelect: (item) ->
    @emit('select', {item: item})

  _dispatchChange: (item) ->
    @emit('change', {item: item})

  _dispatchChangeItems: (item) ->
    @emit('changeItems', {item: item})

  _dispatchEvents: (prevItem) ->
    item = @_getItem()
    @_dispatchSelect(item)
    if @_isChange(prevItem)
      @_dispatchChange(item)

  # private
  _setEventHandlers: ->
    label = @_el.querySelector('.js-searchable-input-label')
    if label
      label.addEventListener 'click', @_handleClickLabel

    searchInput = @_el.querySelector('.searchable-input-search-input')
    if searchInput
      searchInput.addEventListener 'keydown', @_handleKeydownSearchInput
      searchInput.addEventListener 'keyup', @_handleKeyupSearchInput

    mask = @_el.querySelector('.searchable-input-mask')
    if mask
      mask.addEventListener 'click', @_handleClickMask

  _removeEventHandlers: ->
    label = @_el.querySelector('.js-searchable-input-label')
    if label
      label.removeEventListener 'click', @_handleClickLabel

    searchInput = @_el.querySelector('.searchable-input-search-input')
    if searchInput
      searchInput.removeEventListener 'keydown', @_handleKeydownSearchInput
      searchInput.removeEventListener 'keyup', @_handleKeyupSearchInput

    mask = @_el.querySelector('.searchable-input-mask')
    if mask
      mask.removeEventListener 'click', @_handleClickMask

  _setListItemEventHandlers: ->
    listItems = @_el.querySelectorAll('.searchable-input-list-item')
    for listItem in listItems
      listItem.addEventListener 'click', @_handleClickListItem

  _removeListItemEventHandlers: ->
    listItems = @_el.querySelectorAll('.searchable-input-list-item')
    for listItem in listItems
      listItem.removeEventListener 'click', @_handleClickListItem

  ## handlers
  _handleClickLabel: =>
    @_show()
    @_render()
    @_focusInput()

  _handleKeydownSearchInput: (event) =>
    keyCode = event.keyCode
    shift = event.shiftKey
    ctrl = event.ctrlKey || event.metaKey

    label = @_el.querySelector('.js-searchable-input-label')
    switch true
      when keyCode == ENTER_KEYCODE && shift && !ctrl
        event.preventDefault()
        @_selectItemByKeydown()
        @_hide()
        @_render()
        label.focus()
      when keyCode == ENTER_KEYCODE && !shift && !ctrl
        event.preventDefault()
        @_selectItemByKeydown()
        @_hide()
        @_render()
        label.focus()
      when keyCode == TAB_KEYCODE && !shift && !ctrl
        @_selectItemByKeydown()
        @_hide()
        @_render()
      when keyCode == TAB_KEYCODE && shift && !ctrl
        @_selectItemByKeydown()
        @_hide()
        @_render()
        label.focus()
      when keyCode == ESC_KEYCODE && !shift && !ctrl
        @_hide()
        @_render()
      when keyCode == UP_KEYCODE && !shift && !ctrl
        event.preventDefault()
        @_decreaseItemIndex()
        @_renderList()
      when keyCode == DOWN_KEYCODE && !shift && !ctrl
        event.preventDefault()
        @_increaseItemIndex()
        @_renderList()

  _handleKeyupSearchInput: (event) =>
    @_setSearchedItems(SearchableInput._searchItems(@_items, event.target.value))
    @_renderList()

  _handleClickMask: (event) =>
    @_hide()
    @_render()

  _handleClickListItem: (event) =>
    item = JSON.parse(event.target.getAttribute('data-item'))
    prevItem = @_getItem()
    @_setItem(item)
    @_hide()
    @_render()
    @_dispatchEvents(prevItem)

  _selectItemByKeydown: ->
    item = @_findItemByIndex(@_items, @_itemIndex).item
    prevItem = @_getItem()
    @_setItem(item)
    @_renderInput()
    @_dispatchEvents(prevItem)

  _show: ->
    @_setSearchedItems(SearchableInput._searchItems(@_items, ''))
    item = {name: @_labelValue}
    item[@_inputValueKey] = @_inputValue
    @_setItemIndex(@_calcItemIndex(@_items, item, @_inputValueKey))
    @_setIsListShown(true)

  _hide: ->
    @_setIsListShown(false)

  _decreaseItemIndex: ->
    itemIndex = @_itemIndex - 1
    if itemIndex < 0
      itemIndex = @_calcItemLength(@_items) - 1
    @_setItemIndex(itemIndex)

  _increaseItemIndex: ->
    itemIndex = @_itemIndex + 1
    if itemIndex > @_calcItemLength(@_items) - 1
      itemIndex = 0
    @_setItemIndex(itemIndex)

  _calcItemLength: (items) ->
    itemIndex = 0
    for item in items
      if item.items
        itemIndex += @_calcItemLength(item.items)
      else
        itemIndex += 1
    itemIndex

  _calcItemIndex: (items, item, key = 'name') ->
    itemIndex = 0
    for item_, index in items
      if item_.items
        result = @_calcItemIndex(item_.items, item, key)
        itemIndex += result
        if result != item_.items.length
          return itemIndex
      else
        if item_.name == item.name && item_[key] == item[key]
          return itemIndex
        else
          itemIndex += 1
    itemIndex

  _findItemByIndex: (items, itemIndex) ->
    itemIndex_ = 0
    item_ = null
    for item, index in items
      if item.items
        result = @_findItemByIndex(item.items, itemIndex - itemIndex_)
        itemIndex_ += result.index
        if result.item != null
          return {index: itemIndex_, item: result.item}
      else
        if itemIndex_ == itemIndex
          return {index: itemIndex_, item: item}
        else
          itemIndex_ += 1
    return {index: itemIndex_, item: null}

  _focusInput: ->
    # 2度目以降に.searchable-input-search-inputのfocusが効かないので
    # focusを意図的に行う
    @_el.querySelector('.searchable-input-search-input').focus()

  # public - getItem / getValue / updateItem / updateItems
  getSelectedItem: ->
    item = {}
    item.name = @_labelValue
    item[@_inputValueKey] = @_inputValue
    return item

  getValue: ->
    return @_inputValue

  updateItem: (item) ->
    prevItem = @_getItem()
    @_setItem(item)
    @_render()
    if @_isChange(prevItem)
      @_dispatchChange(item)

  updateItems: (items) ->
    @_items = items
    initialItem = SearchableInput._getInitialItem(items)
    @searchedItems = SearchableInput._searchItems(items, '')
    @_setItem(initialItem)
    @_render()
    @_dispatchChangeItems()

  # templates
  _templateItems: (items, itemIndex = 0) =>
    html = ''
    if items != null
      for item, index in items
        escapeItem = _.escape(JSON.stringify(item))
        if item.items
          html += '<li><span class="searchable-input-list-title">' + item.name + '</span><ul>' + @_templateItems(item.items, itemIndex) + '</ul></li>'
          itemIndex += item.items.length
        else
          if itemIndex == @_itemIndex
            html += "<li class='searchable-input-list-item is-selected' data-item='#{ escapeItem }'>" + item.name + '</li>'
          else
            html += "<li class='searchable-input-list-item' data-item='#{ escapeItem }'>" + item.name + '</li>'
          itemIndex += 1
    html

  _templateSearchBox: (searchedItems) =>
    """
    <div class="searchable-input-search-box #{@_getPositionClassNames().join(' ')}">
      <div class="searchable-input-search-input-container">
        <input type="text" class="searchable-input-search-input" />
      </div>
      <div class="searchable-input-list-container">
        <ul class="searchable-input-list">#{ @_templateItems(searchedItems) }</ul>
      </div>
    </div>
    """

  _template: (searchedItems) ->
    """
      <div class="searchable-input">
        <a href="javascript:void(0)" class="js-searchable-input-label searchable-input-label">#{ @_labelValue }</a>
        <input type="hidden" name="#{ @_inputName }" value="#{ @_inputValue }" />
        #{if @_isListShown then @_templateSearchBox(searchedItems) else ''}
      </div>
      #{if @_isListShown then '<div class="searchable-input-mask"></div>' else ''}
    """

  # template helper
  _getPositionClassNames: ->
    # この値より画面の余裕がないければ上表示にする
    maxLeftHeight = 400
    maxLeftWidth = 100

    screen_ =
      width: window.innerWidth
      height: window.innerHeight
    position = @_el.getBoundingClientRect()

    bottomEnd = position.top + @_el.offsetHeight
    rightEnd = position.left + @_el.offsetWidth

    classNames = []
    if screen_.height - bottomEnd < maxLeftHeight
      classNames.push('searchable-input-search-box__top')
    if screen_.width - rightEnd < maxLeftWidth
      classNames.push('searchable-input-search-box__right')
    classNames

  # render
  # _renderInputと_renderListは本来なら不要だが、focusやselectを保持するために
  # 差分更新が必要でそのために作成した
  _renderInput: ->
    input = @_el.querySelector('input[type="hidden"]')
    input.value = @_inputValue

  _renderList: ->
    @_removeListItemEventHandlers()
    @_el.querySelector('.searchable-input-list').innerHTML = @_templateItems(@_searchedItems)
    @_setListItemEventHandlers()
    @_scrollListContainer()

  _render: ->
    @_removeEventHandlers()
    @_removeListItemEventHandlers()
    @_el.innerHTML = @_template(@_searchedItems)
    @_setEventHandlers()
    @_setListItemEventHandlers()
    @_scrollListContainer()

  # render helper
  _scrollListContainer: ->
    # 選択状態にものがあれば、そこまで移動する
    selectedItem = @_el.querySelector('.searchable-input-list-item.is-selected')
    if selectedItem
      itemTop = selectedItem.offsetTop
      scrollBuffer = 110
      @_el.querySelector('.searchable-input-list-container').scrollTop = itemTop - scrollBuffer


if typeof module == 'object' && module.exports
  module.exports = SearchableInput
else
  window.SearchableInput = SearchableInput
