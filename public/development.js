window.addEventListener('load', function() {
  var searchableInputItems = [{
    name: '現金および預金',
    items: [{
      id: 0,
      name: '現金',
      keywords: ['genkin']
    }, {
      id: 1,
      name: '当座預金',
      keywords: ['tozayokin']
    }, {
      id: 2,
      name: '普通預金',
      keywords: ['futsuyokin']
    }, {
      id: 3,
      name: '定期預金',
      keywords: ['teikiyokin']
    }],
  }, {
    name: '売上債権',
    items: [{
      id: 4,
      name: '受取手形',
      keywords: ['uketoritegata']
    }, {
      id: 5,
      name: '売掛金',
      keywords: ['urikakekin']
    }]
  }];

  var searchableInput = new SearchableInput(
    document.querySelector('.js-searchable-input'),
    searchableInputItems,
    {
      inputName: 'item_id',
      inputValueKey: 'id'
    }
  );

  searchableInput.on('select', function(value) {
    console.log('select:', value);
  });

  searchableInput.on('change', function(value) {
    console.log('change:', value);
  });


  // From Select Element
  new SearchableInput(document.querySelector('.js-select-applied-searchable-input'));
});
