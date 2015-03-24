Usage
=====

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

    //an action is a simple function
    function notifyUser(message) {
      alert(message)
    }

    //actions can be namespaced in objects
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

    //alternatively define a list of actions
    var RegistrationSteps = [
      'startRegistration',
      'addAccountInfo',
      'addBillingInfo',
      'sendConfirmation',
      'receivedConfirmation'
    ]

    //action namespaces can be nested
    var actions = {
      page: PageActions(site_id, api),
      notifyUser: notifyUser,
      registration: RegistrationSteps
    }



Create a Flux::

    var stores = {
      pages: new PageStore(site_id)
    }

    var actions = {
      page: PageActions(site_id, api),
      notifyUser: notifyUser,
      registration: RegistrationSteps
    }


    var flux = new Refluxxor.Flux(stores, actions)

    //then put flux in your context


Fire Actions::


    flux.actions.page.createPage({title: 'Hello World'});
    flux.actions.page.deletePage(43)

    flux.actions.registration.startRegistration();


Use streams::

    flux.actions.page.createPage.subscribe(x => console.log("got page:", x))
    flux.actions.page.createPage.emitter.onError(console.error)
    flux.stores.page.emitter.map(x => x.length).skipDuplicates().onValue(x => console.log('New page size', x));


Bind State::

    var PageListing = React.createClass({
      mixins:[ConnectTo('pages')],
      render: function() {
        <ul>
        {this.state.map( (page, page_id) => <li key={page_id}>{page.title}</li>)}
        </ul>
      }
    });


Mount with Flux::

    React.withContext({flux}, function () {
      React.render(<PageListing/>, document.getElementById('pagelist'));
    });


Inspirations
============

Projects:

* Reflux - https://github.com/spoike/refluxjs
* Fluxxor - http://fluxxor.com/
* Kefir - https://pozadi.github.io/kefir/


Goals:

* No singletons
* Event streams
* Distill Flux into actions & stores
* Bring your own promises
* ES6 as a first class citizen
* React style lifecycle methods
