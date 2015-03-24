Define stores::

    class UserStore extends Store {
      onSomething() {
        this.trigger('foo')
        //or
        this.replaceState({loaded: true});
      }
      storeDidMount(flux) {
        this.bindTo(flux.actions.loginSuccess, x => this.replaceState({user: x}))
      }
      //inherits subscribe(f)
    }


    class PageStore extends AutoBindStore {
      //AutoBindStore will auto connect flux actions to your method names
      //and optionally takes a namespace
      static actionNamespace = 'page'
      getInitialState() {
        return []
      }
      onAddPage(page_obj) { 
        var pages = this.state.concat([page_obj])
        this.replaceState(page);
      }
    }



Define Actions::

    function PageActions(site_id, api) {
      return {
        createPage(page_def) {
          return api.call('createPage', page_def).then(this.addPage)
        },
        addPage(page_def) {
          return page_def
        },
        deletePage(page_id) {
          return api.call('deletePage', page_id).then(x => this.removePage(page_id))
        },
        removePage(page_id) {
          return page_id;
        }
      }
    }

    var actions = {
      page: PageActions(site_id, api),
      publish: function() { //pure function as action
        return api.call('publish')
      } //gets subscribe(f, key) tacked on
    }

    //alternatively  define a list of actions
    var actions = [
      'actionOne',
      'actionTwo'
    ]


Create a flux::

    var stores = {
      'pages': new PageStore(site_id)
    }


    var flux = new Refluxxor.Flux(stores, actions)

    flux.actions.page.createPage()
    flux.actions.page.createPage.subscribe(callback)
    flux.actions.page.createPage.emitter.onError(console.error)
    flux.stores.pages.subscribe(f)

    //then put flux in your context


Fire Actions::

    flux.actions.page.readPages()


Use streams::

    flux.stores.page.emitter.map(x => x.length).skipDuplicates().onValue(x => console.log('New page size', x));




