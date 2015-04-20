import expect from 'expect.js';
import {createAction} from '../src/actions';


describe('actions', () => {
  describe('createAction', () => {
    it('wraps function to an event stream', () => {
      var action = createAction(x => x*2);
      expect(action).to.be.a('function');
      action.mount()
      expect(action.emitter).to.be.ok(); //TODO a kefir stream to be exact

      var args;
      //err, babel is poorly transforming arguments
      action.emitter.onValue(x => {args = [x]});
      var result = action(4);
      expect(result).to.be(8);
      expect(args).to.be.ok();

      expect(args.length).to.be(1);
      expect(args[0]).to.be(4);
    })
  });

})
