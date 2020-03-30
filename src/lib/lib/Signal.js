/* eslint-disable */

class SignalBinding {
	constructor(signal, listener, isOnce, listenerContext, priority) {
		/**
		* @property _listener - Handle bound to the signal.
		* @private
		*/
		this._listener = listener;

		/**
		* @property {boolean} isOnce - If binding should be executed just once.
		* @private
		*/
		this.isOnce = isOnce;

		/**
		* @property {object|undefined|null} context - Context on which listener will be executed (object that should represent the `this` variable inside listene).
		*/
		this.context = listenerContext;

		/**
		* @property {Signal} signal - Reference to Signal object that listener is currently bound to.
		* @private
		*/
		this.signal = signal;

		/**
		* @property {number} _priority - Listener priority.
		* @private
		*/
		this._priority = priority || 0;
	}
	/**
	* Call listener passing arbitrary parameters.
	* If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.
	* @method SignalBinding#execute
	* @param {array} [paramsArr] - Array of parameters that should be passed to the listener.
	* @return {any} Value returned by the listener.
	*/
	execute(paramsArr) {

		var handlerReturn, params;

		if (SignalBinding.active && !!this._listener) {
			params = this.params ? this.params.concat(paramsArr) : paramsArr;
			handlerReturn = this._listener.apply(this.context, params);

			if (this.isOnce) {
				this.detach();
			}
		}

		return handlerReturn;

	}

	/**
	* Detach binding from signal.
	* alias to: @see mySignal.remove(myBinding.listener);
	* @method SignalBinding#detach
	* @return|null} Handle bound to the signal or `null` if binding was previously detached.
	*/
	detach() {
		return this.isBound() ? this.signal.remove(this._listener, this.context) : null;
	}

	/**
	* @method SignalBinding#isBound
	* @return {boolean} True if binding is still bound to the signal and has a listener.
	*/
	isBound() {
		return (!!this.signal && !!this._listener);
	}

	/**
	* Delete instance properties
	* @method SignalBinding#_destroy
	* @private
	*/
	_destroy() {
		delete this.signal;
		delete this._listener;
		delete this.context;
	}

	/**
	* @method SignalBinding#toString
	* @return {string} String representation of the object.
	*/
	toString() {
		return '[SignalBinding isOnce:' + this.isOnce + ', isBound:' + this.isBound() + ', active:' + SignalBinding.active + ']';
	}
}

/**
      * If binding is active and should be executed.
      * @property {boolean} active
      * @default
      */
SignalBinding.active = true;

/**
* Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute` (curried parameters).
* @property {array|null} params
* @default
*/
SignalBinding.params = null;

/**
    * @author       Miller Medeiros http://millermedeiros.github.com/js-signals/
    * @author       Richard Davey <rich@photonstorm.com>
    * @copyright    2014 Photon Storm Ltd.
    * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
    */

/**
* A Signal is used for object communication via a custom broadcaster instead of Events.
*
* @class Signal
* @constructor
*/
export default class Signal {
	constructor() {
		/**
			* @property {Array.<SignalBinding>} _bindings - Internal variable.
			* @private
			*/
		this._bindings = [];

		/**
		* @property {any} _prevParams - Internal variable.
		* @private
		*/
		this._prevParams = null;

		/*
		// enforce dispatch to aways work on same context (#47)
		var self = this;
	
		/**
		* @property } dispatch - The dispatch is what sends the Signal out.
		//*
		this.dispatch = () => {
		  this.prototype.dispatch.apply(self, arguments);
		};*/
	}
	/**
	* @method Signal#validateListener
	* @param } listener - Signal handler.
	* @param {string} fnName - name.
	* @private
	*/
	validateListener(listener, fnName) {
		if (typeof listener !== 'function') {
			throw new Error('Signal: listener is a required param of {fn}() and should be a.'.replace('{fn}', fnName));
		}
	}

	/**
	* @method Signal#_registerListener
	* @private
	* @param } listener - Signal handler.
	* @param {boolean} isOnce - Should the listener only be called once?
	* @param {object} [listenerContext] - The context under which the listener is invoked.
	* @param {number} [priority] - The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0).
	* @return {SignalBinding} An Object representing the binding between the Signal and listener.
	*/
	_registerListener(listener, isOnce, listenerContext, priority) {
		var prevIndex = this._indexOfListener(listener, listenerContext);
		var binding;

		if (prevIndex !== -1) {
			binding = this._bindings[prevIndex];

			if (binding.isOnce !== isOnce) {
				throw new Error('You cannot add' + (isOnce ? '' : 'Once') + '() then add' + (!isOnce ? '' : 'Once') + '() the same listener without removing the relationship first.');
			}
		}
		else {
			binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
			this._addBinding(binding);
		}

		if (Signal.memorize && this._prevParams) {
			binding.execute(this._prevParams);
		}

		return binding;
	}

	/**
	* @method Signal#_addBinding
	* @private
	* @param {SignalBinding} binding - An Object representing the binding between the Signal and listener.
	*/
	_addBinding(binding) {
		//  Simplified insertion sort
		var n = this._bindings.length;

		do {
			n--;
		}
		while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);

		this._bindings.splice(n + 1, 0, binding);
	}

	/**
	* @method Signal#_indexOfListener
	* @private
	* @param } listener - Signal handler.
	* @return {number} The index of the listener within the private bindings array.
	*/
	_indexOfListener(listener, context) {
		var n = this._bindings.length;
		var cur;

		while (n--) {
			cur = this._bindings[n];

			if (cur._listener === listener && cur.context === context) {
				return n;
			}
		}

		return -1;
	}

	/**
	* Check if listener was attached to Signal.
	*
	* @method Signal#has
	* @param } listener - Signal handler.
	* @param {object} [context] - Context on which listener will be executed (object that should represent the `this` variable inside listener).
	* @return {boolean} If Signal has the specified listener.
	*/
	has(listener, context) {
		return this._indexOfListener(listener, context) !== -1;
	}

	/**
	* Add a listener to the signal.
	*
	* @method Signal#add
	* @param } listener - The to call when this Signal is dispatched.
	* @param {object} [listenerContext] - The context under which the listener will be executed (i.e. the object that should represent the `this` variable).
	* @param {number} [priority] - The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added (default = 0)
	* @return {SignalBinding} An Object representing the binding between the Signal and listener.
	*/
	add(listener, listenerContext, priority) {
		this.validateListener(listener, 'add');

		return this._registerListener(listener, false, listenerContext, priority);
	}

	/**
	* Add listener to the signal that should be removed after first execution (will be executed only once).
	*
	* @method Signal#addOnce
	* @param } listener - The to call when this Signal is dispatched.
	* @param {object} [listenerContext] - The context under which the listener will be executed (i.e. the object that should represent the `this` variable).
	* @param {number} [priority] - The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added (default = 0)
	* @return {SignalBinding} An Object representing the binding between the Signal and listener.
	*/
	addOnce(listener, listenerContext, priority) {
		this.validateListener(listener, 'addOnce');

		return this._registerListener(listener, true, listenerContext, priority);
	}

	/**
	* Remove a single listener from the dispatch queue.
	*
	* @method Signal#remove
	* @param } listener - Handler that should be removed.
	* @param {object} [context] - Execution context (since you can add the same handler multiple times if executing in a different context).
	* @return } Listener handler.
	*/
	remove(listener, context) {
		this.validateListener(listener, 'remove');

		var i = this._indexOfListener(listener, context);

		if (i !== -1) {
			this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
			this._bindings.splice(i, 1);
		}

		return listener;
	}

	/**
	* Remove all listeners from the Signal.
	*
	* @method Signal#removeAll
	* @param {object} [context=null] - If specified only listeners for the given context will be removed.
	*/
	removeAll(context) {
		if (typeof context === 'undefined') { context = null; }

		var n = this._bindings.length;

		while (n--) {
			if (context) {
				if (this._bindings[n].context === context) {
					this._bindings[n]._destroy();
					this._bindings.splice(n, 1);
				}
			}
			else {
				this._bindings[n]._destroy();
			}
		}

		if (!context) {
			this._bindings.length = 0;
		}
	}

	/**
	* Gets the total number of listeneres attached to ths Signal.
	*
	* @method Signal#getNumListeners
	* @return {number} Number of listeners attached to the Signal.
	*/
	getNumListeners() {
		return this._bindings.length;
	}

	/**
	* Stop propagation of the event, blocking the dispatch to next listeners on the queue.
	* IMPORTANT: should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.
	* @see Signal.prototype.disable
	*
	* @method Signal#halt
	*/
	halt() {
		Signal._shouldPropagate = false;
	}

	/**
	* Dispatch/Broadcast Signal to all listeners added to the queue.
	*
	* @method Signal#dispatch
	* @param {any} [params] - Parameters that should be passed to each handler.
	*/
	dispatch() {
		if (!Signal.active) {
			return;
		}

		var paramsArr = Array.prototype.slice.call(arguments);
		var n = this._bindings.length;
		var bindings;

		if (Signal.memorize) {
			this._prevParams = paramsArr;
		}

		if (!n) {
			//  Should come after memorize
			return;
		}

		bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
		Signal._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

		//execute all callbacks until end of the list or until a callback returns `false` or stops propagation
		//reverse loop since listeners with higher priority will be added at the end of the list
		do {
			n--;
		}
		while (bindings[n] && Signal._shouldPropagate && bindings[n].execute(paramsArr) !== false);
	}

	/**
	* Forget memorized arguments.
	* @see Signal.memorize
	*
	* @method Signal#forget
	*/
	forget() {
		this._prevParams = null;
	}

	/**
	* Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
	* IMPORTANT: calling any method on the signal instance after calling dispose will throw errors.
	*
	* @method Signal#dispose
	*/
	dispose() {
		this.removeAll();

		delete this._bindings;
		delete this._prevParams;
	}

	/**
	*
	* @method Signal#toString
	* @return {string} String representation of the object.
	*/
	toString() {
		return '[Signal active:' + this.active + ' numListeners:' + this.getNumListeners() + ']';
	}
}
/**
        * If Signal should keep record of previously dispatched parameters and
        * automatically execute listener during `add()`/`addOnce()` if Signal was
        * already dispatched before.
        * @property {boolean} memorize
        */
Signal.memorize = false;

/**
* @property {boolean} _shouldPropagate
* @private
*/
Signal._shouldPropagate = true;

/**
* If Signal is active and should broadcast events.
* IMPORTANT: Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.
* @property {boolean} active
* @default
*/
Signal.active = true;