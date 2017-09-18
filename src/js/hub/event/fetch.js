/*
 * fetch event srouce
 * @param {String} url
 * @param {void | object} args
 * @return {dispatcher | void}
 */

'use strict';

export default function ( url, args = { } ) {
    if ( url ) {

        const { emit, converter } = this;

        let timer = void 0;

        const dispatcher = { };

        let queue = [ ];

        // 出队列
        let exec = async ( result ) => {
            if ( queue.length > 0 ) {
                let _result = result;

                for ( _i of queue ) {
                    switch ( _i.type ) {
                        case '__convert__': {
                            _result = await _i.func( _result );
                            break;
                        }
                        case '__emit__': {
                            _i.func( _result );
                            break;
                        }
                    }
                }
            }
        }

        dispatcher.convert = ( key ) => {
            if ( converter[ key ] ) {
                queue.push({
                    type: '__convert__',
                    func: converter[ key ],
                });
            }
            return dispatcher;
        }

        // send the HTTP request by fetch, and fetch data flow
        dispatcher.emit = ( key, data ) => {
            queue.push({
                type: '__emit__',
                func: ( result ) => {
                    if ( data ) {
                        emit.bind( this )( key, { result, data, } );
                    }
                    else {
                        emit.bind( this )( key, result );
                    }
                },
            })

            // 链式多次 emit 去抖
            if ( timer ) {
                clearTimeout( timer );
            }

            timer = setTimeout(() => {
                dispatcher.reload();
            }, 0);

            return dispatcher;
        }

        dispatcher.reload = () => {
            fetch( url, args )
                .then(( res ) => {
                    if ( res.status === 200 && res.json ) {
                        res.json().then( data => exec( data ) );
                    }
                    else {
                        exec( res );
                    }
                })
                .catch(( err ) => {
                    exec( err );
                });
        }

        return dispatcher;
    }
};