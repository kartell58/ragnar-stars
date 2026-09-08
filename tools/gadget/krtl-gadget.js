// niki/noXY v26.184 pure script - all logic inside rpc.exports.init, nothing at module level
var cache = {};

function ensureLibg(cb) {
	var tries = 0;
	(function poll() {
		var m = Process.findModuleByName('libg.so');
		if (m) { cb(m); return; }
		if (++tries > 100) { console.log('[RagnarStars] libg.so nao carregou apos 20s'); return; }
		setTimeout(poll, 200);
	})();
}

function setupMessaging(base) {
	var malloc = new NativeFunction(Module.findExportByName('libc.so', 'malloc'), 'pointer', ['int']);
	var free = new NativeFunction(Module.findExportByName('libc.so', 'free'), 'void', ['pointer']);
	var pthread_mutex_lock = new NativeFunction(Module.findExportByName('libc.so', 'pthread_mutex_lock'), 'int', ['pointer']);
	var pthread_mutex_unlock = new NativeFunction(Module.findExportByName('libc.so', 'pthread_mutex_unlock'), 'int', ['pointer']);
	var memmove = new NativeFunction(Module.findExportByName('libc.so', 'memmove'), 'pointer', ['pointer', 'pointer', 'int']);
	var libc_send = new NativeFunction(Module.findExportByName('libc.so', 'send'), 'int', ['int', 'pointer', 'int', 'int']);
	var libc_recv = new NativeFunction(Module.findExportByName('libc.so', 'recv'), 'int', ['int', 'pointer', 'int', 'int']);

	var Message = {
		_getByteStream: function(message) { return message.add(8); },
		_getVersion: function(message) { return Memory.readInt(message.add(4)); },
		_setVersion: function(message, version) { Memory.writeInt(message.add(4), version); },
		_getMessageType: function(message) {
			return (new NativeFunction(Memory.readPointer(Memory.readPointer(message).add(20)), 'int', ['pointer']))(message);
		},
		_encode: function(message) {
			(new NativeFunction(Memory.readPointer(Memory.readPointer(message).add(8)), 'void', ['pointer']))(message);
		},
		_decode: function(message) {
			(new NativeFunction(Memory.readPointer(Memory.readPointer(message).add(12)), 'void', ['pointer']))(message);
		},
		_free: function(message) {
			(new NativeFunction(Memory.readPointer(Memory.readPointer(message).add(24)), 'void', ['pointer']))(message);
			(new NativeFunction(Memory.readPointer(Memory.readPointer(message).add(4)), 'void', ['pointer']))(message);
		}
	};

	var ByteStream = {
		_getOffset: function(byteStream) { return Memory.readInt(byteStream.add(16)); },
		_getByteArray: function(byteStream) { return Memory.readPointer(byteStream.add(28)); },
		_setByteArray: function(byteStream, array) { Memory.writePointer(byteStream.add(28), array); },
		_getLength: function(byteStream) { return Memory.readInt(byteStream.add(20)); },
		_setLength: function(byteStream, length) { Memory.writeInt(byteStream.add(20), length); }
	};

	var Buffer = {
		_getEncodingLength: function(buffer) {
			return Memory.readU8(buffer.add(2)) << 16 | Memory.readU8(buffer.add(3)) << 8 | Memory.readU8(buffer.add(4));
		},
		_setEncodingLength: function(buffer, length) {
			Memory.writeU8(buffer.add(2), length >> 16 & 0xFF);
			Memory.writeU8(buffer.add(3), length >> 8 & 0xFF);
			Memory.writeU8(buffer.add(4), length & 0xFF);
		},
		_setMessageType: function(buffer, type) {
			Memory.writeU8(buffer.add(0), type >> 8 & 0xFF);
			Memory.writeU8(buffer.add(1), type & 0xFF);
		},
		_getMessageVersion: function(buffer) {
			return Memory.readU8(buffer.add(5)) << 8 | Memory.readU8(buffer.add(6));
		},
		_setMessageVersion: function(buffer, version) {
			Memory.writeU8(buffer.add(5), version >> 8 & 0xFF);
			Memory.writeU8(buffer.add(6), version & 0xFF);
		},
		_getMessageType: function(buffer) {
			return Memory.readU8(buffer) << 8 | Memory.readU8(buffer.add(1));
		}
	};

	var MessageQueue = {
		_getCapacity: function(queue) { return Memory.readInt(queue.add(4)); },
		_get: function(queue, index) { return Memory.readPointer(Memory.readPointer(queue).add(4 * index)); },
		_set: function(queue, index, message) { Memory.writePointer(Memory.readPointer(queue).add(4 * index), message); },
		_count: function(queue) { return Memory.readInt(queue.add(8)); },
		_decrementCount: function(queue) { Memory.writeInt(queue.add(8), Memory.readInt(queue.add(8)) - 1); },
		_incrementCount: function(queue) { Memory.writeInt(queue.add(8), Memory.readInt(queue.add(8)) + 1); },
		_getDequeueIndex: function(queue) { return Memory.readInt(queue.add(12)); },
		_getEnqueueIndex: function(queue) { return Memory.readInt(queue.add(16)); },
		_setDequeueIndex: function(queue, index) { Memory.writeInt(queue.add(12), index); },
		_setEnqueueIndex: function(queue, index) { Memory.writeInt(queue.add(16), index); },
		_enqueue: function(queue, message) {
			pthread_mutex_lock(queue.sub(4));
			var index = MessageQueue._getEnqueueIndex(queue);
			MessageQueue._set(queue, index, message);
			MessageQueue._setEnqueueIndex(queue, (index + 1) % MessageQueue._getCapacity(queue));
			MessageQueue._incrementCount(queue);
			pthread_mutex_unlock(queue.sub(4));
		},
		_dequeue: function(queue) {
			var message = null;
			pthread_mutex_lock(queue.sub(4));
			if (MessageQueue._count(queue)) {
				var index = MessageQueue._getDequeueIndex(queue);
				message = MessageQueue._get(queue, index);
				MessageQueue._setDequeueIndex(queue, (index + 1) % MessageQueue._getCapacity(queue));
				MessageQueue._decrementCount(queue);
			}
			pthread_mutex_unlock(queue.sub(4));
			return message;
		}
	};

	var SERVER_CONNECTION = 0xBB3A3C;
	var PTHREAD_COND_WAKE_RETURN = 0x7762F6 + 8 + 1;
	var CREATE_MESSAGE_BY_TYPE = 0x54486C;

	cache.pthreadReturn = base.add(PTHREAD_COND_WAKE_RETURN);
	cache.serverConnection = Memory.readPointer(base.add(SERVER_CONNECTION));
	cache.messaging = Memory.readPointer(cache.serverConnection.add(4));
	cache.messageFactory = Memory.readPointer(cache.messaging.add(52));
	cache.recvQueue = cache.messaging.add(60);
	cache.sendQueue = cache.messaging.add(84);
	cache.state = cache.messaging.add(208);
	cache.loginMessagePtr = cache.messaging.add(212);

	cache.createMessageByType = new NativeFunction(base.add(CREATE_MESSAGE_BY_TYPE), 'pointer', ['pointer', 'int']);

	cache.sendMessage = function(message) {
		Message._encode(message);
		var byteStream = Message._getByteStream(message);
		var messagePayloadLength = ByteStream._getOffset(byteStream);
		var messageBuffer = malloc(messagePayloadLength + 7);
		memmove(messageBuffer.add(7), ByteStream._getByteArray(byteStream), messagePayloadLength);
		Buffer._setEncodingLength(messageBuffer, messagePayloadLength);
		Buffer._setMessageType(messageBuffer, Message._getMessageType(message));
		Buffer._setMessageVersion(messageBuffer, Message._getVersion(message));
		var total = messagePayloadLength + 7;
		var sent = 0;
		while (sent < total) {
			var nb = libc_send(cache.fd, messageBuffer.add(sent), total - sent, 0);
			if (nb <= 0) {
				console.log('[RagnarStars] send err: ' + nb);
				break;
			}
			sent += nb;
		}
		free(messageBuffer);
	};

	function onWakeup() {
		if (!cache.ready || !cache.fd) return;
		var message = MessageQueue._dequeue(cache.sendQueue);
		while (message) {
			var messageType = Message._getMessageType(message);
			console.log('[RagNS] C2S type=' + messageType);
			if (messageType === 10100) {
				message = Memory.readPointer(cache.loginMessagePtr);
				Memory.writePointer(cache.loginMessagePtr, ptr(0));
			}
			cache.sendMessage(message);
			message = MessageQueue._dequeue(cache.sendQueue);
		}
	}

	function onReceive() {
		if (!cache.ready || !cache.fd) return;
		var headerBuffer = malloc(7);
		var got = 0;
		var nb;
		while (got < 7) {
			nb = libc_recv(cache.fd, headerBuffer.add(got), 7 - got, 256);
			if (nb <= 0) { free(headerBuffer); return; }
			got += nb;
		}
		var messageType = Buffer._getMessageType(headerBuffer);
		var payloadLength = Buffer._getEncodingLength(headerBuffer);
		console.log('[RagNS] S2C type=' + messageType + ' len=' + payloadLength);
		if (messageType < 20000) { free(headerBuffer); return; }
		if (payloadLength <= 0 || payloadLength > 16 * 1024 * 1024) {
			console.log('[RagNS] S2C payload invalido len=' + payloadLength);
			free(headerBuffer);
			return;
		}
		if (messageType === 20104) {
			Memory.writeInt(cache.state, 5);
			console.log('[RagNS] LoginOk -> state=5');
		}
		var messageVersion = Buffer._getMessageVersion(headerBuffer);
		free(headerBuffer);
		var messageBuffer = malloc(payloadLength);
		var tries = 0;
		got = 0;
		while (got < payloadLength) {
			nb = libc_recv(cache.fd, messageBuffer.add(got), payloadLength - got, 256);
			if (nb <= 0) { free(messageBuffer); return; }
			got += nb;
			if (got >= payloadLength) break;
			if (++tries > 200) {
				console.log('[RagNS] S2C frame incompleto (' + got + '/' + payloadLength + ')');
				free(messageBuffer);
				return;
			}
			Thread.sleep(0.005);
		}
		var message = cache.createMessageByType(cache.messageFactory, messageType);
		Message._setVersion(message, messageVersion);
		var byteStream = Message._getByteStream(message);
		ByteStream._setLength(byteStream, payloadLength);

		if (payloadLength) {
			var byteArray = malloc(payloadLength);
			memmove(byteArray, messageBuffer, payloadLength);
			ByteStream._setByteArray(byteStream, byteArray);
		}

		Message._decode(message);
		MessageQueue._enqueue(cache.recvQueue, message);
		free(messageBuffer);
	}

	cache.ready = true;
	if (!cache.hooked) {
		cache.hooked = true;
		Interceptor.attach(Module.findExportByName('libc.so', 'pthread_cond_signal'), {
			onEnter: function(args) { try { onWakeup(); } catch (e) { console.log('[RagnarStars] wakeup err: ' + e); } }
		});
		Interceptor.attach(Module.findExportByName('libc.so', 'select'), {
			onEnter: function(args) { try { onReceive(); } catch (e) { console.log('[RagnarStars] recv err: ' + e); } }
		});
	}
}

function connect(base, parameters) {
	var redirectHost = (parameters && parameters.redirectHost) || '127.0.0.1';
	var redirectPort = Number((parameters && parameters.redirectPort) || 9339) & 0xFFFF;
	var inet_addr = new NativeFunction(Module.findExportByName('libc.so', 'inet_addr'), 'uint32', ['pointer']);
	var ntohs = new NativeFunction(Module.findExportByName('libc.so', 'ntohs'), 'uint16', ['uint16']);

	Interceptor.attach(Module.findExportByName('libc.so', 'connect'), {
		onEnter: function(args) {
			try {
				var sockaddr = args[1];
				var port = (Memory.readU8(sockaddr.add(2)) << 8) | Memory.readU8(sockaddr.add(3));
				console.log('[RagnarStars] connect fd=' + args[0].toInt32() + ' port=' + port + ' -> ' + redirectHost + ':' + redirectPort);
				if (port === 9449 || port === 9339) {
					cache.fd = args[0].toInt32();
					var host = Memory.allocUtf8String(redirectHost);
					sockaddr.add(2).writeU16(((redirectPort & 0x00FF) << 8) | ((redirectPort & 0xFF00) >> 8));
					sockaddr.add(4).writeU32(inet_addr(host));
					console.log('[RagnarStars] redirect OK');
					setupMessaging(base);
				}
			} catch (e) {
				console.log('[RagnarStars] connect err: ' + e);
			}
		}
	});
}

function ping(redirectHost, redirectPort) {
	try {
		var socket = new NativeFunction(Module.findExportByName('libc.so', 'socket'), 'int', ['int', 'int', 'int']);
		cache.pingFd = socket(2, 1, 6);
		if (cache.pingFd < 0) return;
		var inet_addr = new NativeFunction(Module.findExportByName('libc.so', 'inet_addr'), 'uint32', ['pointer']);
		var sa = Memory.alloc(16);
		sa.add(0).writeU8(2);
		sa.add(1).writeU8(0);
		sa.add(2).writeU16(((redirectPort & 0x00FF) << 8) | ((redirectPort & 0xFF00) >> 8));
		sa.add(4).writeU32(inet_addr(Memory.allocUtf8String(redirectHost)));
		var cn = new NativeFunction(Module.findExportByName('libc.so', 'connect'), 'int', ['int', 'pointer', 'int']);
		if (cn(cache.pingFd, sa, 16) === 0) {
			var malloc2 = new NativeFunction(Module.findExportByName('libc.so', 'malloc'), 'pointer', ['int']);
			var send = new NativeFunction(Module.findExportByName('libc.so', 'send'), 'int', ['int', 'pointer', 'int', 'int']);
			var hdr = malloc2(7);
			var t = 0xEA33;
			hdr.writeU8(t >> 8); hdr.writeU8(t & 0xFF);
			hdr.add(2).writeU8(0); hdr.add(3).writeU8(0); hdr.add(4).writeU8(0);
			hdr.add(5).writeU8(0); hdr.add(6).writeU8(0);
			send(cache.pingFd, hdr, 7, 0);
		}
	} catch (e) {
		console.log('[RagnarStars] ping err: ' + e);
	}
}

rpc.exports.init = function(parameters) {
	try {
		var redirectHost = (parameters && parameters.redirectHost) || '127.0.0.1';
		var redirectPort = Number((parameters && parameters.redirectPort) || 9339) & 0xFFFF;
		console.log('[RagnarStars] init redirect=' + redirectHost + ':' + redirectPort);
		ensureLibg(function(m) {
			try {
				var base = m.base;
				console.log('[RagnarStars] libg base=' + base);
				connect(base, parameters);
				ping(redirectHost, redirectPort);
			} catch (e) {
				console.log('[RagnarStars] start err: ' + e);
			}
		});
	} catch (e) {
		console.log('[RagnarStars] init err: ' + e);
	}
};