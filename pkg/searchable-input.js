(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */

'use strict';

/**
 * Module variables.
 * @private
 */

var matchHtmlRegExp = /["'&<>]/;

/**
 * Module exports.
 * @public
 */

module.exports = escapeHtml;

/**
 * Escape special characters in the given string of html.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index
    ? html + str.substring(lastIndex, index)
    : html;
}

},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
var DOWN_KEYCODE, ENTER_KEYCODE, ESC_KEYCODE, EventEmitter, SearchableInput, TAB_KEYCODE, UP_KEYCODE, escapeHtml, uniq,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

escapeHtml = require('escape-html');

EventEmitter = require('events').EventEmitter;

TAB_KEYCODE = 9;

ENTER_KEYCODE = 13;

ESC_KEYCODE = 27;

UP_KEYCODE = 38;

DOWN_KEYCODE = 40;

uniq = function(arr) {
  var i, ret;
  ret = [];
  i = 0;
  while (i < arr.length) {
    if (ret.indexOf(arr[i]) === -1) {
      ret.push(arr[i]);
    }
    i++;
  }
  return ret;
};

SearchableInput = (function(superClass) {
  extend(SearchableInput, superClass);

  SearchableInput._searchItems = function(items, searchwords) {
    var searchedItems, searchwords_, tmp;
    searchedItems = [];
    tmp = [];
    searchwords_ = searchwords.replace(new RegExp('　', 'g'), ' ').split(' ');
    items.forEach(function(item) {
      if (!item.items) {
        searchwords_.forEach(function(keyword_) {
          if (keyword_ === '' && searchwords_.length > 1) {
            return;
          }
          items.forEach(function(item_) {
            if (item_.name.toUpperCase().indexOf(keyword_.toUpperCase()) !== -1) {
              if (!item_.items) {
                tmp.push(item_);
              }
            }
            if (item_.keywords) {
              return item_.keywords.forEach(function(keyword) {
                if (keyword.toUpperCase().indexOf(keyword_.toUpperCase()) !== -1) {
                  return tmp.push(item_);
                }
              });
            }
          });
          searchedItems = tmp.concat();
          return tmp = [];
        });
      } else {
        tmp = SearchableInput._searchItems(item.items, searchwords);
        if (tmp.length !== 0) {
          searchedItems.push({
            name: item.name,
            items: tmp
          });
        }
      }
      return searchedItems;
    });
    return uniq(searchedItems);
  };

  SearchableInput._getInitialItem = function(items) {
    if (items[0].items) {
      return SearchableInput._getInitialItem(items[0].items);
    } else {
      return items[0];
    }
  };

  SearchableInput.selectElementSerialize = function(selectElement) {
    var _retrieveKeywords, item, itemElement, itemElements, items, j, k, len, len1, optionElement, optionElements;
    itemElements = selectElement.querySelectorAll('select > option, select > optgroup');
    items = [];
    _retrieveKeywords = function(optionElement) {
      var keywords;
      keywords = optionElement.getAttribute('data-keywords');
      if (keywords) {
        return JSON.parse(keywords);
      } else {
        return [];
      }
    };
    for (j = 0, len = itemElements.length; j < len; j++) {
      itemElement = itemElements[j];
      if (itemElement.tagName === 'OPTION') {
        item = {
          name: itemElement.text.trim(),
          value: itemElement.value
        };
        item.keywords = _retrieveKeywords(itemElement);
        items.push(item);
      }
      if (itemElement.tagName === 'OPTGROUP') {
        items.push({
          name: itemElement.label,
          items: []
        });
        optionElements = itemElement.querySelectorAll('optgroup > option');
        for (k = 0, len1 = optionElements.length; k < len1; k++) {
          optionElement = optionElements[k];
          item = {
            name: optionElement.text.trim(),
            value: optionElement.value
          };
          item.keywords = _retrieveKeywords(optionElement);
          items[items.length - 1].items.push(item);
        }
      }
    }
    return items;
  };

  SearchableInput.selectElementOptionSerialize = function(selectElement) {
    return {
      inputName: selectElement.name,
      inputValueKey: 'value'
    };
  };

  function SearchableInput(_el, _items, options) {
    var initialItem, newEl;
    this._el = _el;
    this._items = _items != null ? _items : [];
    if (options == null) {
      options = {};
    }
    this._templateSearchBox = bind(this._templateSearchBox, this);
    this._templateItems = bind(this._templateItems, this);
    this._handleClickListItem = bind(this._handleClickListItem, this);
    this._handleClickMask = bind(this._handleClickMask, this);
    this._handleKeyupSearchInput = bind(this._handleKeyupSearchInput, this);
    this._handleKeydownSearchInput = bind(this._handleKeydownSearchInput, this);
    this._handleClickLabel = bind(this._handleClickLabel, this);
    SearchableInput.__super__.constructor.call(this);
    if (!(this._el instanceof HTMLElement)) {
      console.error('Invalid argument passed. First argument is not HTMLElement and might be jQuery object. ');
    } else if (this._el.tagName === 'SELECT') {
      this._items = SearchableInput.selectElementSerialize(this._el);
      options = SearchableInput.selectElementOptionSerialize(this._el);
      initialItem = {
        name: this._el.querySelector('option:checked').text.trim(),
        value: this._el.value
      };
      newEl = document.createElement('div');
      newEl.id = this._el.id;
      newEl.className = this._el.className;
      this._el.parentNode.replaceChild(newEl, this._el);
      this._el = newEl;
    }
    initialItem = initialItem || options.initialItem || SearchableInput._getInitialItem(this._items);
    this._inputName = options.inputName || this._el.getAttribute('name') || 'name';
    this._inputValueKey = options.inputValueKey || 'name';
    this._labelValue = initialItem.name;
    this._inputValue = initialItem[this._inputValueKey];
    this._itemIndex = 0;
    this._searchedItems = SearchableInput._searchItems(this._items, '');
    this._isListShown = false;
    this._el.classList.add('searchable-input-container');
    this._render();
  }

  SearchableInput.prototype._getItem = function() {
    var item;
    item = {
      name: this._labelValue
    };
    item[this._inputValueKey] = this._inputValue;
    return item;
  };

  SearchableInput.prototype._setItem = function(item) {
    this._labelValue = item.name;
    return this._inputValue = item[this._inputValueKey];
  };

  SearchableInput.prototype._setIsListShown = function(isListShown) {
    return this._isListShown = isListShown;
  };

  SearchableInput.prototype._setItemIndex = function(itemIndex) {
    return this._itemIndex = itemIndex;
  };

  SearchableInput.prototype._setSearchedItems = function(searchedItems) {
    return this._searchedItems = searchedItems;
  };

  SearchableInput.prototype._isChange = function(prevItem) {
    return !(prevItem.name === this._labelValue && prevItem[this._inputValueKey] === this._inputValue);
  };

  SearchableInput.prototype._dispatchSelect = function(item) {
    return this.emit('select', {
      item: item
    });
  };

  SearchableInput.prototype._dispatchChange = function(item) {
    return this.emit('change', {
      item: item
    });
  };

  SearchableInput.prototype._dispatchChangeItems = function(item) {
    return this.emit('changeItems', {
      item: item
    });
  };

  SearchableInput.prototype._dispatchEvents = function(prevItem) {
    var item;
    item = this._getItem();
    this._dispatchSelect(item);
    if (this._isChange(prevItem)) {
      return this._dispatchChange(item);
    }
  };

  SearchableInput.prototype._setEventHandlers = function() {
    var label, mask, searchInput;
    label = this._el.querySelector('.js-searchable-input-label');
    if (label) {
      label.addEventListener('click', this._handleClickLabel);
    }
    searchInput = this._el.querySelector('.searchable-input-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', this._handleKeydownSearchInput);
      searchInput.addEventListener('keyup', this._handleKeyupSearchInput);
    }
    mask = this._el.querySelector('.searchable-input-mask');
    if (mask) {
      return mask.addEventListener('click', this._handleClickMask);
    }
  };

  SearchableInput.prototype._removeEventHandlers = function() {
    var label, mask, searchInput;
    label = this._el.querySelector('.js-searchable-input-label');
    if (label) {
      label.removeEventListener('click', this._handleClickLabel);
    }
    searchInput = this._el.querySelector('.searchable-input-search-input');
    if (searchInput) {
      searchInput.removeEventListener('keydown', this._handleKeydownSearchInput);
      searchInput.removeEventListener('keyup', this._handleKeyupSearchInput);
    }
    mask = this._el.querySelector('.searchable-input-mask');
    if (mask) {
      return mask.removeEventListener('click', this._handleClickMask);
    }
  };

  SearchableInput.prototype._setListItemEventHandlers = function() {
    var j, len, listItem, listItems, results;
    listItems = this._el.querySelectorAll('.searchable-input-list-item');
    results = [];
    for (j = 0, len = listItems.length; j < len; j++) {
      listItem = listItems[j];
      results.push(listItem.addEventListener('click', this._handleClickListItem));
    }
    return results;
  };

  SearchableInput.prototype._removeListItemEventHandlers = function() {
    var j, len, listItem, listItems, results;
    listItems = this._el.querySelectorAll('.searchable-input-list-item');
    results = [];
    for (j = 0, len = listItems.length; j < len; j++) {
      listItem = listItems[j];
      results.push(listItem.removeEventListener('click', this._handleClickListItem));
    }
    return results;
  };

  SearchableInput.prototype._handleClickLabel = function() {
    this._show();
    this._render();
    return this._focusInput();
  };

  SearchableInput.prototype._handleKeydownSearchInput = function(event) {
    var ctrl, keyCode, label, shift;
    keyCode = event.keyCode;
    shift = event.shiftKey;
    ctrl = event.ctrlKey || event.metaKey;
    label = this._el.querySelector('.js-searchable-input-label');
    switch (true) {
      case keyCode === ENTER_KEYCODE && shift && !ctrl:
        event.preventDefault();
        this._selectItemByKeydown();
        this._hide();
        this._render();
        return label.focus();
      case keyCode === ENTER_KEYCODE && !shift && !ctrl:
        event.preventDefault();
        this._selectItemByKeydown();
        this._hide();
        this._render();
        return label.focus();
      case keyCode === TAB_KEYCODE && !shift && !ctrl:
        this._selectItemByKeydown();
        this._hide();
        return this._render();
      case keyCode === TAB_KEYCODE && shift && !ctrl:
        this._selectItemByKeydown();
        this._hide();
        this._render();
        return label.focus();
      case keyCode === ESC_KEYCODE && !shift && !ctrl:
        this._hide();
        return this._render();
      case keyCode === UP_KEYCODE && !shift && !ctrl:
        event.preventDefault();
        this._decreaseItemIndex();
        return this._renderList();
      case keyCode === DOWN_KEYCODE && !shift && !ctrl:
        event.preventDefault();
        this._increaseItemIndex();
        return this._renderList();
    }
  };

  SearchableInput.prototype._handleKeyupSearchInput = function(event) {
    this._setSearchedItems(SearchableInput._searchItems(this._items, event.target.value));
    return this._renderList();
  };

  SearchableInput.prototype._handleClickMask = function(event) {
    this._hide();
    return this._render();
  };

  SearchableInput.prototype._handleClickListItem = function(event) {
    var item, prevItem;
    item = JSON.parse(event.target.getAttribute('data-item'));
    prevItem = this._getItem();
    this._setItem(item);
    this._hide();
    this._render();
    return this._dispatchEvents(prevItem);
  };

  SearchableInput.prototype._selectItemByKeydown = function() {
    var item, prevItem;
    item = this._findItemByIndex(this._items, this._itemIndex).item;
    prevItem = this._getItem();
    this._setItem(item);
    this._renderInput();
    return this._dispatchEvents(prevItem);
  };

  SearchableInput.prototype._show = function() {
    var item;
    this._setSearchedItems(SearchableInput._searchItems(this._items, ''));
    item = {
      name: this._labelValue
    };
    item[this._inputValueKey] = this._inputValue;
    this._setItemIndex(this._calcItemIndex(this._items, item, this._inputValueKey));
    return this._setIsListShown(true);
  };

  SearchableInput.prototype._hide = function() {
    return this._setIsListShown(false);
  };

  SearchableInput.prototype._decreaseItemIndex = function() {
    var itemIndex;
    itemIndex = this._itemIndex - 1;
    if (itemIndex < 0) {
      itemIndex = this._calcItemLength(this._items) - 1;
    }
    return this._setItemIndex(itemIndex);
  };

  SearchableInput.prototype._increaseItemIndex = function() {
    var itemIndex;
    itemIndex = this._itemIndex + 1;
    if (itemIndex > this._calcItemLength(this._items) - 1) {
      itemIndex = 0;
    }
    return this._setItemIndex(itemIndex);
  };

  SearchableInput.prototype._calcItemLength = function(items) {
    var item, itemIndex, j, len;
    itemIndex = 0;
    for (j = 0, len = items.length; j < len; j++) {
      item = items[j];
      if (item.items) {
        itemIndex += this._calcItemLength(item.items);
      } else {
        itemIndex += 1;
      }
    }
    return itemIndex;
  };

  SearchableInput.prototype._calcItemIndex = function(items, item, key) {
    var index, itemIndex, item_, j, len, result;
    if (key == null) {
      key = 'name';
    }
    itemIndex = 0;
    for (index = j = 0, len = items.length; j < len; index = ++j) {
      item_ = items[index];
      if (item_.items) {
        result = this._calcItemIndex(item_.items, item, key);
        itemIndex += result;
        if (result !== item_.items.length) {
          return itemIndex;
        }
      } else {
        if (item_.name === item.name && item_[key] === item[key]) {
          return itemIndex;
        } else {
          itemIndex += 1;
        }
      }
    }
    return itemIndex;
  };

  SearchableInput.prototype._findItemByIndex = function(items, itemIndex) {
    var index, item, itemIndex_, item_, j, len, result;
    itemIndex_ = 0;
    item_ = null;
    for (index = j = 0, len = items.length; j < len; index = ++j) {
      item = items[index];
      if (item.items) {
        result = this._findItemByIndex(item.items, itemIndex - itemIndex_);
        itemIndex_ += result.index;
        if (result.item !== null) {
          return {
            index: itemIndex_,
            item: result.item
          };
        }
      } else {
        if (itemIndex_ === itemIndex) {
          return {
            index: itemIndex_,
            item: item
          };
        } else {
          itemIndex_ += 1;
        }
      }
    }
    return {
      index: itemIndex_,
      item: null
    };
  };

  SearchableInput.prototype._focusInput = function() {
    return this._el.querySelector('.searchable-input-search-input').focus();
  };

  SearchableInput.prototype.getSelectedItem = function() {
    var item;
    item = {};
    item.name = this._labelValue;
    item[this._inputValueKey] = this._inputValue;
    return item;
  };

  SearchableInput.prototype.getValue = function() {
    return this._inputValue;
  };

  SearchableInput.prototype.updateItem = function(item) {
    var prevItem;
    prevItem = this._getItem();
    this._setItem(item);
    this._render();
    if (this._isChange(prevItem)) {
      return this._dispatchChange(item);
    }
  };

  SearchableInput.prototype.updateItems = function(items) {
    var initialItem;
    this._items = items;
    initialItem = SearchableInput._getInitialItem(items);
    this.searchedItems = SearchableInput._searchItems(items, '');
    this._setItem(initialItem);
    this._render();
    return this._dispatchChangeItems();
  };

  SearchableInput.prototype._templateItems = function(items, itemIndex) {
    var escapeItem, html, index, item, j, len;
    if (itemIndex == null) {
      itemIndex = 0;
    }
    html = '';
    if (items !== null) {
      for (index = j = 0, len = items.length; j < len; index = ++j) {
        item = items[index];
        escapeItem = escapeHtml(JSON.stringify(item));
        if (item.items) {
          html += '<li><span class="searchable-input-list-title">' + item.name + '</span><ul>' + this._templateItems(item.items, itemIndex) + '</ul></li>';
          itemIndex += item.items.length;
        } else {
          if (itemIndex === this._itemIndex) {
            html += ("<li class='searchable-input-list-item is-selected' data-item='" + escapeItem + "'>") + item.name + '</li>';
          } else {
            html += ("<li class='searchable-input-list-item' data-item='" + escapeItem + "'>") + item.name + '</li>';
          }
          itemIndex += 1;
        }
      }
    }
    return html;
  };

  SearchableInput.prototype._templateSearchBox = function(searchedItems) {
    return "<div class=\"searchable-input-search-box " + (this._getPositionClassNames().join(' ')) + "\">\n  <div class=\"searchable-input-search-input-container\">\n    <input type=\"text\" class=\"searchable-input-search-input\" />\n  </div>\n  <div class=\"searchable-input-list-container\">\n    <ul class=\"searchable-input-list\">" + (this._templateItems(searchedItems)) + "</ul>\n  </div>\n</div>";
  };

  SearchableInput.prototype._template = function(searchedItems) {
    return "<div class=\"searchable-input\">\n  <a href=\"javascript:void(0)\" class=\"js-searchable-input-label searchable-input-label\">" + this._labelValue + "</a>\n  <input type=\"hidden\" name=\"" + this._inputName + "\" value=\"" + this._inputValue + "\" />\n  " + (this._isListShown ? this._templateSearchBox(searchedItems) : '') + "\n</div>\n" + (this._isListShown ? '<div class="searchable-input-mask"></div>' : '');
  };

  SearchableInput.prototype._getPositionClassNames = function() {
    var bottomEnd, classNames, maxLeftHeight, maxLeftWidth, position, rightEnd, screen_;
    maxLeftHeight = 400;
    maxLeftWidth = 100;
    screen_ = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    position = this._el.getBoundingClientRect();
    bottomEnd = position.top + this._el.offsetHeight;
    rightEnd = position.left + this._el.offsetWidth;
    classNames = [];
    if (screen_.height - bottomEnd < maxLeftHeight) {
      classNames.push('searchable-input-search-box__top');
    }
    if (screen_.width - rightEnd < maxLeftWidth) {
      classNames.push('searchable-input-search-box__right');
    }
    return classNames;
  };

  SearchableInput.prototype._renderInput = function() {
    var input;
    input = this._el.querySelector('input[type="hidden"]');
    return input.value = this._inputValue;
  };

  SearchableInput.prototype._renderList = function() {
    this._removeListItemEventHandlers();
    this._el.querySelector('.searchable-input-list').innerHTML = this._templateItems(this._searchedItems);
    this._setListItemEventHandlers();
    return this._scrollListContainer();
  };

  SearchableInput.prototype._render = function() {
    this._removeEventHandlers();
    this._removeListItemEventHandlers();
    this._el.innerHTML = this._template(this._searchedItems);
    this._setEventHandlers();
    this._setListItemEventHandlers();
    return this._scrollListContainer();
  };

  SearchableInput.prototype._scrollListContainer = function() {
    var itemTop, scrollBuffer, selectedItem;
    selectedItem = this._el.querySelector('.searchable-input-list-item.is-selected');
    if (selectedItem) {
      itemTop = selectedItem.offsetTop;
      scrollBuffer = 110;
      return this._el.querySelector('.searchable-input-list-container').scrollTop = itemTop - scrollBuffer;
    }
  };

  return SearchableInput;

})(EventEmitter);

module.exports = SearchableInput;


},{"escape-html":1,"events":2}],4:[function(require,module,exports){
var SearchableInput;

SearchableInput = require('./SearchableInput');

window.SearchableInput = SearchableInput;


},{"./SearchableInput":3}]},{},[4]);
