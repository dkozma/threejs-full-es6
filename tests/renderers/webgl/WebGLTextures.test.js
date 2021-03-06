var Three = (function (exports) {
	'use strict';

	var ClampToEdgeWrapping = 1001;

	var NearestFilter = 1003;
	var NearestMipMapNearestFilter = 1004;
	var NearestMipMapLinearFilter = 1005;
	var LinearFilter = 1006;





	var UnsignedShortType = 1012;

	var UnsignedIntType = 1014;
	var FloatType = 1015;
	var HalfFloatType = 1016;



	var UnsignedInt248Type = 1020;

	var RGBFormat = 1022;
	var RGBAFormat = 1023;



	var DepthFormat = 1026;
	var DepthStencilFormat = 1027;

	/**
	 * @author alteredq / http://alteredqualia.com/
	 * @author mrdoob / http://mrdoob.com/
	 */

	var _Math = {

		DEG2RAD: Math.PI / 180,
		RAD2DEG: 180 / Math.PI,

		generateUUID: ( function () {

			// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

			var lut = [];

			for ( var i = 0; i < 256; i ++ ) {

				lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 ).toUpperCase();

			}

			return function () {

				var d0 = Math.random() * 0xffffffff | 0;
				var d1 = Math.random() * 0xffffffff | 0;
				var d2 = Math.random() * 0xffffffff | 0;
				var d3 = Math.random() * 0xffffffff | 0;
				return lut[ d0 & 0xff ] + lut[ d0 >> 8 & 0xff ] + lut[ d0 >> 16 & 0xff ] + lut[ d0 >> 24 & 0xff ] + '-' +
					lut[ d1 & 0xff ] + lut[ d1 >> 8 & 0xff ] + '-' + lut[ d1 >> 16 & 0x0f | 0x40 ] + lut[ d1 >> 24 & 0xff ] + '-' +
					lut[ d2 & 0x3f | 0x80 ] + lut[ d2 >> 8 & 0xff ] + '-' + lut[ d2 >> 16 & 0xff ] + lut[ d2 >> 24 & 0xff ] +
					lut[ d3 & 0xff ] + lut[ d3 >> 8 & 0xff ] + lut[ d3 >> 16 & 0xff ] + lut[ d3 >> 24 & 0xff ];

			};

		} )(),

		clamp: function ( value, min, max ) {

			return Math.max( min, Math.min( max, value ) );

		},

		// compute euclidian modulo of m % n
		// https://en.wikipedia.org/wiki/Modulo_operation

		euclideanModulo: function ( n, m ) {

			return ( ( n % m ) + m ) % m;

		},

		// Linear mapping from range <a1, a2> to range <b1, b2>

		mapLinear: function ( x, a1, a2, b1, b2 ) {

			return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

		},

		// https://en.wikipedia.org/wiki/Linear_interpolation

		lerp: function ( x, y, t ) {

			return ( 1 - t ) * x + t * y;

		},

		// http://en.wikipedia.org/wiki/Smoothstep

		smoothstep: function ( x, min, max ) {

			if ( x <= min ) return 0;
			if ( x >= max ) return 1;

			x = ( x - min ) / ( max - min );

			return x * x * ( 3 - 2 * x );

		},

		smootherstep: function ( x, min, max ) {

			if ( x <= min ) return 0;
			if ( x >= max ) return 1;

			x = ( x - min ) / ( max - min );

			return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

		},

		// Random integer from <low, high> interval

		randInt: function ( low, high ) {

			return low + Math.floor( Math.random() * ( high - low + 1 ) );

		},

		// Random float from <low, high> interval

		randFloat: function ( low, high ) {

			return low + Math.random() * ( high - low );

		},

		// Random float from <-range/2, range/2> interval

		randFloatSpread: function ( range ) {

			return range * ( 0.5 - Math.random() );

		},

		degToRad: function ( degrees ) {

			return degrees * _Math.DEG2RAD;

		},

		radToDeg: function ( radians ) {

			return radians * _Math.RAD2DEG;

		},

		isPowerOfTwo: function ( value ) {

			return ( value & ( value - 1 ) ) === 0 && value !== 0;

		},

		ceilPowerOfTwo: function ( value ) {

			return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );

		},

		floorPowerOfTwo: function ( value ) {

			return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

		}

	};

	/**
	 * @author mrdoob / http://mrdoob.com/
	 */

	function WebGLTextures( _gl, extensions, state, properties, capabilities, utils, infoMemory ) {

		var _isWebGL2 = ( typeof WebGL2RenderingContext !== 'undefined' && _gl instanceof window.WebGL2RenderingContext );
		var _videoTextures = {};

		//

		function clampToMaxSize( image, maxSize ) {

			if ( image.width > maxSize || image.height > maxSize ) {

				// Warning: Scaling through the canvas will only work with images that use
				// premultiplied alpha.

				var scale = maxSize / Math.max( image.width, image.height );

				var canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
				canvas.width = Math.floor( image.width * scale );
				canvas.height = Math.floor( image.height * scale );

				var context = canvas.getContext( '2d' );
				context.drawImage( image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height );

				console.warn( 'THREE.WebGLRenderer: image is too big (' + image.width + 'x' + image.height + '). Resized to ' + canvas.width + 'x' + canvas.height, image );

				return canvas;

			}

			return image;

		}

		function isPowerOfTwo( image ) {

			return _Math.isPowerOfTwo( image.width ) && _Math.isPowerOfTwo( image.height );

		}

		function makePowerOfTwo( image ) {

			if ( image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap ) {

				var canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
				canvas.width = _Math.floorPowerOfTwo( image.width );
				canvas.height = _Math.floorPowerOfTwo( image.height );

				var context = canvas.getContext( '2d' );
				context.drawImage( image, 0, 0, canvas.width, canvas.height );

				console.warn( 'THREE.WebGLRenderer: image is not power of two (' + image.width + 'x' + image.height + '). Resized to ' + canvas.width + 'x' + canvas.height, image );

				return canvas;

			}

			return image;

		}

		function textureNeedsPowerOfTwo( texture ) {

			return ( texture.wrapS !== ClampToEdgeWrapping || texture.wrapT !== ClampToEdgeWrapping ) ||
				( texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter );

		}

		function textureNeedsGenerateMipmaps( texture, isPowerOfTwo ) {

			return texture.generateMipmaps && isPowerOfTwo &&
				texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter;

		}

		// Fallback filters for non-power-of-2 textures

		function filterFallback( f ) {

			if ( f === NearestFilter || f === NearestMipMapNearestFilter || f === NearestMipMapLinearFilter ) {

				return _gl.NEAREST;

			}

			return _gl.LINEAR;

		}

		//

		function onTextureDispose( event ) {

			var texture = event.target;

			texture.removeEventListener( 'dispose', onTextureDispose );

			deallocateTexture( texture );

			if ( texture.isVideoTexture ) {

				delete _videoTextures[ texture.id ];

			}

			infoMemory.textures --;

		}

		function onRenderTargetDispose( event ) {

			var renderTarget = event.target;

			renderTarget.removeEventListener( 'dispose', onRenderTargetDispose );

			deallocateRenderTarget( renderTarget );

			infoMemory.textures --;

		}

		//

		function deallocateTexture( texture ) {

			var textureProperties = properties.get( texture );

			if ( texture.image && textureProperties.__image__webglTextureCube ) {

				// cube texture

				_gl.deleteTexture( textureProperties.__image__webglTextureCube );

			} else {

				// 2D texture

				if ( textureProperties.__webglInit === undefined ) return;

				_gl.deleteTexture( textureProperties.__webglTexture );

			}

			// remove all webgl properties
			properties.remove( texture );

		}

		function deallocateRenderTarget( renderTarget ) {

			var renderTargetProperties = properties.get( renderTarget );
			var textureProperties = properties.get( renderTarget.texture );

			if ( ! renderTarget ) return;

			if ( textureProperties.__webglTexture !== undefined ) {

				_gl.deleteTexture( textureProperties.__webglTexture );

			}

			if ( renderTarget.depthTexture ) {

				renderTarget.depthTexture.dispose();

			}

			if ( renderTarget.isWebGLRenderTargetCube ) {

				for ( var i = 0; i < 6; i ++ ) {

					_gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer[ i ] );
					if ( renderTargetProperties.__webglDepthbuffer ) _gl.deleteRenderbuffer( renderTargetProperties.__webglDepthbuffer[ i ] );

				}

			} else {

				_gl.deleteFramebuffer( renderTargetProperties.__webglFramebuffer );
				if ( renderTargetProperties.__webglDepthbuffer ) _gl.deleteRenderbuffer( renderTargetProperties.__webglDepthbuffer );

			}

			properties.remove( renderTarget.texture );
			properties.remove( renderTarget );

		}

		//



		function setTexture2D( texture, slot ) {

			var textureProperties = properties.get( texture );

			if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

				var image = texture.image;

				if ( image === undefined ) {

					console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is undefined', texture );

				} else if ( image.complete === false ) {

					console.warn( 'THREE.WebGLRenderer: Texture marked for update but image is incomplete', texture );

				} else {

					uploadTexture( textureProperties, texture, slot );
					return;

				}

			}

			state.activeTexture( _gl.TEXTURE0 + slot );
			state.bindTexture( _gl.TEXTURE_2D, textureProperties.__webglTexture );

		}

		function setTextureCube( texture, slot ) {

			var textureProperties = properties.get( texture );

			if ( texture.image.length === 6 ) {

				if ( texture.version > 0 && textureProperties.__version !== texture.version ) {

					if ( ! textureProperties.__image__webglTextureCube ) {

						texture.addEventListener( 'dispose', onTextureDispose );

						textureProperties.__image__webglTextureCube = _gl.createTexture();

						infoMemory.textures ++;

					}

					state.activeTexture( _gl.TEXTURE0 + slot );
					state.bindTexture( _gl.TEXTURE_CUBE_MAP, textureProperties.__image__webglTextureCube );

					_gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );

					var isCompressed = ( texture && texture.isCompressedTexture );
					var isDataTexture = ( texture.image[ 0 ] && texture.image[ 0 ].isDataTexture );

					var cubeImage = [];

					for ( var i = 0; i < 6; i ++ ) {

						if ( ! isCompressed && ! isDataTexture ) {

							cubeImage[ i ] = clampToMaxSize( texture.image[ i ], capabilities.maxCubemapSize );

						} else {

							cubeImage[ i ] = isDataTexture ? texture.image[ i ].image : texture.image[ i ];

						}

					}

					var image = cubeImage[ 0 ],
						isPowerOfTwoImage = isPowerOfTwo( image ),
						glFormat = utils.convert( texture.format ),
						glType = utils.convert( texture.type );

					setTextureParameters( _gl.TEXTURE_CUBE_MAP, texture, isPowerOfTwoImage );

					for ( var i = 0; i < 6; i ++ ) {

						if ( ! isCompressed ) {

							if ( isDataTexture ) {

								state.texImage2D( _gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glFormat, cubeImage[ i ].width, cubeImage[ i ].height, 0, glFormat, glType, cubeImage[ i ].data );

							} else {

								state.texImage2D( _gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glFormat, glFormat, glType, cubeImage[ i ] );

							}

						} else {

							var mipmap, mipmaps = cubeImage[ i ].mipmaps;

							for ( var j = 0, jl = mipmaps.length; j < jl; j ++ ) {

								mipmap = mipmaps[ j ];

								if ( texture.format !== RGBAFormat && texture.format !== RGBFormat ) {

									if ( state.getCompressedTextureFormats().indexOf( glFormat ) > - 1 ) {

										state.compressedTexImage2D( _gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glFormat, mipmap.width, mipmap.height, 0, mipmap.data );

									} else {

										console.warn( 'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()' );

									}

								} else {

									state.texImage2D( _gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );

								}

							}

						}

					}

					if ( textureNeedsGenerateMipmaps( texture, isPowerOfTwoImage ) ) {

						_gl.generateMipmap( _gl.TEXTURE_CUBE_MAP );

					}

					textureProperties.__version = texture.version;

					if ( texture.onUpdate ) texture.onUpdate( texture );

				} else {

					state.activeTexture( _gl.TEXTURE0 + slot );
					state.bindTexture( _gl.TEXTURE_CUBE_MAP, textureProperties.__image__webglTextureCube );

				}

			}

		}

		function setTextureCubeDynamic( texture, slot ) {

			state.activeTexture( _gl.TEXTURE0 + slot );
			state.bindTexture( _gl.TEXTURE_CUBE_MAP, properties.get( texture ).__webglTexture );

		}

		function setTextureParameters( textureType, texture, isPowerOfTwoImage ) {

			var extension;

			if ( isPowerOfTwoImage ) {

				_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_S, utils.convert( texture.wrapS ) );
				_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_T, utils.convert( texture.wrapT ) );

				_gl.texParameteri( textureType, _gl.TEXTURE_MAG_FILTER, utils.convert( texture.magFilter ) );
				_gl.texParameteri( textureType, _gl.TEXTURE_MIN_FILTER, utils.convert( texture.minFilter ) );

			} else {

				_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE );
				_gl.texParameteri( textureType, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE );

				if ( texture.wrapS !== ClampToEdgeWrapping || texture.wrapT !== ClampToEdgeWrapping ) {

					console.warn( 'THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.', texture );

				}

				_gl.texParameteri( textureType, _gl.TEXTURE_MAG_FILTER, filterFallback( texture.magFilter ) );
				_gl.texParameteri( textureType, _gl.TEXTURE_MIN_FILTER, filterFallback( texture.minFilter ) );

				if ( texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter ) {

					console.warn( 'THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.', texture );

				}

			}

			extension = extensions.get( 'EXT_texture_filter_anisotropic' );

			if ( extension ) {

				if ( texture.type === FloatType && extensions.get( 'OES_texture_float_linear' ) === null ) return;
				if ( texture.type === HalfFloatType && extensions.get( 'OES_texture_half_float_linear' ) === null ) return;

				if ( texture.anisotropy > 1 || properties.get( texture ).__currentAnisotropy ) {

					_gl.texParameterf( textureType, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min( texture.anisotropy, capabilities.getMaxAnisotropy() ) );
					properties.get( texture ).__currentAnisotropy = texture.anisotropy;

				}

			}

		}

		function uploadTexture( textureProperties, texture, slot ) {

			if ( textureProperties.__webglInit === undefined ) {

				textureProperties.__webglInit = true;

				texture.addEventListener( 'dispose', onTextureDispose );

				textureProperties.__webglTexture = _gl.createTexture();

				if ( texture.isVideoTexture ) {

					_videoTextures[ texture.id ] = texture;

				}

				infoMemory.textures ++;

			}

			state.activeTexture( _gl.TEXTURE0 + slot );
			state.bindTexture( _gl.TEXTURE_2D, textureProperties.__webglTexture );

			_gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );
			_gl.pixelStorei( _gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha );
			_gl.pixelStorei( _gl.UNPACK_ALIGNMENT, texture.unpackAlignment );

			var image = clampToMaxSize( texture.image, capabilities.maxTextureSize );

			if ( textureNeedsPowerOfTwo( texture ) && isPowerOfTwo( image ) === false ) {

				image = makePowerOfTwo( image );

			}

			var isPowerOfTwoImage = isPowerOfTwo( image ),
				glFormat = utils.convert( texture.format ),
				glType = utils.convert( texture.type );

			setTextureParameters( _gl.TEXTURE_2D, texture, isPowerOfTwoImage );

			var mipmap, mipmaps = texture.mipmaps;

			if ( texture.isDepthTexture ) {

				// populate depth texture with dummy data

				var internalFormat = _gl.DEPTH_COMPONENT;

				if ( texture.type === FloatType ) {

					if ( ! _isWebGL2 ) throw new Error( 'Float Depth Texture only supported in WebGL2.0' );
					internalFormat = _gl.DEPTH_COMPONENT32F;

				} else if ( _isWebGL2 ) {

					// WebGL 2.0 requires signed internalformat for glTexImage2D
					internalFormat = _gl.DEPTH_COMPONENT16;

				}

				if ( texture.format === DepthFormat && internalFormat === _gl.DEPTH_COMPONENT ) {

					// The error INVALID_OPERATION is generated by texImage2D if format and internalformat are
					// DEPTH_COMPONENT and type is not UNSIGNED_SHORT or UNSIGNED_INT
					// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
					if ( texture.type !== UnsignedShortType && texture.type !== UnsignedIntType ) {

						console.warn( 'THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture.' );

						texture.type = UnsignedShortType;
						glType = utils.convert( texture.type );

					}

				}

				// Depth stencil textures need the DEPTH_STENCIL internal format
				// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
				if ( texture.format === DepthStencilFormat ) {

					internalFormat = _gl.DEPTH_STENCIL;

					// The error INVALID_OPERATION is generated by texImage2D if format and internalformat are
					// DEPTH_STENCIL and type is not UNSIGNED_INT_24_8_WEBGL.
					// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
					if ( texture.type !== UnsignedInt248Type ) {

						console.warn( 'THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture.' );

						texture.type = UnsignedInt248Type;
						glType = utils.convert( texture.type );

					}

				}

				state.texImage2D( _gl.TEXTURE_2D, 0, internalFormat, image.width, image.height, 0, glFormat, glType, null );

			} else if ( texture.isDataTexture ) {

				// use manually created mipmaps if available
				// if there are no manual mipmaps
				// set 0 level mipmap and then use GL to generate other mipmap levels

				if ( mipmaps.length > 0 && isPowerOfTwoImage ) {

					for ( var i = 0, il = mipmaps.length; i < il; i ++ ) {

						mipmap = mipmaps[ i ];
						state.texImage2D( _gl.TEXTURE_2D, i, glFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );

					}

					texture.generateMipmaps = false;

				} else {

					state.texImage2D( _gl.TEXTURE_2D, 0, glFormat, image.width, image.height, 0, glFormat, glType, image.data );

				}

			} else if ( texture.isCompressedTexture ) {

				for ( var i = 0, il = mipmaps.length; i < il; i ++ ) {

					mipmap = mipmaps[ i ];

					if ( texture.format !== RGBAFormat && texture.format !== RGBFormat ) {

						if ( state.getCompressedTextureFormats().indexOf( glFormat ) > - 1 ) {

							state.compressedTexImage2D( _gl.TEXTURE_2D, i, glFormat, mipmap.width, mipmap.height, 0, mipmap.data );

						} else {

							console.warn( 'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()' );

						}

					} else {

						state.texImage2D( _gl.TEXTURE_2D, i, glFormat, mipmap.width, mipmap.height, 0, glFormat, glType, mipmap.data );

					}

				}

			} else {

				// regular Texture (image, video, canvas)

				// use manually created mipmaps if available
				// if there are no manual mipmaps
				// set 0 level mipmap and then use GL to generate other mipmap levels

				if ( mipmaps.length > 0 && isPowerOfTwoImage ) {

					for ( var i = 0, il = mipmaps.length; i < il; i ++ ) {

						mipmap = mipmaps[ i ];
						state.texImage2D( _gl.TEXTURE_2D, i, glFormat, glFormat, glType, mipmap );

					}

					texture.generateMipmaps = false;

				} else {

					state.texImage2D( _gl.TEXTURE_2D, 0, glFormat, glFormat, glType, image );

				}

			}

			if ( textureNeedsGenerateMipmaps( texture, isPowerOfTwoImage ) ) _gl.generateMipmap( _gl.TEXTURE_2D );

			textureProperties.__version = texture.version;

			if ( texture.onUpdate ) texture.onUpdate( texture );

		}

		// Render targets

		// Setup storage for target texture and bind it to correct framebuffer
		function setupFrameBufferTexture( framebuffer, renderTarget, attachment, textureTarget ) {

			var glFormat = utils.convert( renderTarget.texture.format );
			var glType = utils.convert( renderTarget.texture.type );
			state.texImage2D( textureTarget, 0, glFormat, renderTarget.width, renderTarget.height, 0, glFormat, glType, null );
			_gl.bindFramebuffer( _gl.FRAMEBUFFER, framebuffer );
			_gl.framebufferTexture2D( _gl.FRAMEBUFFER, attachment, textureTarget, properties.get( renderTarget.texture ).__webglTexture, 0 );
			_gl.bindFramebuffer( _gl.FRAMEBUFFER, null );

		}

		// Setup storage for internal depth/stencil buffers and bind to correct framebuffer
		function setupRenderBufferStorage( renderbuffer, renderTarget ) {

			_gl.bindRenderbuffer( _gl.RENDERBUFFER, renderbuffer );

			if ( renderTarget.depthBuffer && ! renderTarget.stencilBuffer ) {

				_gl.renderbufferStorage( _gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, renderTarget.width, renderTarget.height );
				_gl.framebufferRenderbuffer( _gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer );

			} else if ( renderTarget.depthBuffer && renderTarget.stencilBuffer ) {

				_gl.renderbufferStorage( _gl.RENDERBUFFER, _gl.DEPTH_STENCIL, renderTarget.width, renderTarget.height );
				_gl.framebufferRenderbuffer( _gl.FRAMEBUFFER, _gl.DEPTH_STENCIL_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer );

			} else {

				// FIXME: We don't support !depth !stencil
				_gl.renderbufferStorage( _gl.RENDERBUFFER, _gl.RGBA4, renderTarget.width, renderTarget.height );

			}

			_gl.bindRenderbuffer( _gl.RENDERBUFFER, null );

		}

		// Setup resources for a Depth Texture for a FBO (needs an extension)
		function setupDepthTexture( framebuffer, renderTarget ) {

			var isCube = ( renderTarget && renderTarget.isWebGLRenderTargetCube );
			if ( isCube ) throw new Error( 'Depth Texture with cube render targets is not supported' );

			_gl.bindFramebuffer( _gl.FRAMEBUFFER, framebuffer );

			if ( ! ( renderTarget.depthTexture && renderTarget.depthTexture.isDepthTexture ) ) {

				throw new Error( 'renderTarget.depthTexture must be an instance of THREE.DepthTexture' );

			}

			// upload an empty depth texture with framebuffer size
			if ( ! properties.get( renderTarget.depthTexture ).__webglTexture ||
					renderTarget.depthTexture.image.width !== renderTarget.width ||
					renderTarget.depthTexture.image.height !== renderTarget.height ) {

				renderTarget.depthTexture.image.width = renderTarget.width;
				renderTarget.depthTexture.image.height = renderTarget.height;
				renderTarget.depthTexture.needsUpdate = true;

			}

			setTexture2D( renderTarget.depthTexture, 0 );

			var webglDepthTexture = properties.get( renderTarget.depthTexture ).__webglTexture;

			if ( renderTarget.depthTexture.format === DepthFormat ) {

				_gl.framebufferTexture2D( _gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.TEXTURE_2D, webglDepthTexture, 0 );

			} else if ( renderTarget.depthTexture.format === DepthStencilFormat ) {

				_gl.framebufferTexture2D( _gl.FRAMEBUFFER, _gl.DEPTH_STENCIL_ATTACHMENT, _gl.TEXTURE_2D, webglDepthTexture, 0 );

			} else {

				throw new Error( 'Unknown depthTexture format' );

			}

		}

		// Setup GL resources for a non-texture depth buffer
		function setupDepthRenderbuffer( renderTarget ) {

			var renderTargetProperties = properties.get( renderTarget );

			var isCube = ( renderTarget.isWebGLRenderTargetCube === true );

			if ( renderTarget.depthTexture ) {

				if ( isCube ) throw new Error( 'target.depthTexture not supported in Cube render targets' );

				setupDepthTexture( renderTargetProperties.__webglFramebuffer, renderTarget );

			} else {

				if ( isCube ) {

					renderTargetProperties.__webglDepthbuffer = [];

					for ( var i = 0; i < 6; i ++ ) {

						_gl.bindFramebuffer( _gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer[ i ] );
						renderTargetProperties.__webglDepthbuffer[ i ] = _gl.createRenderbuffer();
						setupRenderBufferStorage( renderTargetProperties.__webglDepthbuffer[ i ], renderTarget );

					}

				} else {

					_gl.bindFramebuffer( _gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer );
					renderTargetProperties.__webglDepthbuffer = _gl.createRenderbuffer();
					setupRenderBufferStorage( renderTargetProperties.__webglDepthbuffer, renderTarget );

				}

			}

			_gl.bindFramebuffer( _gl.FRAMEBUFFER, null );

		}

		// Set up GL resources for the render target
		function setupRenderTarget( renderTarget ) {

			var renderTargetProperties = properties.get( renderTarget );
			var textureProperties = properties.get( renderTarget.texture );

			renderTarget.addEventListener( 'dispose', onRenderTargetDispose );

			textureProperties.__webglTexture = _gl.createTexture();

			infoMemory.textures ++;

			var isCube = ( renderTarget.isWebGLRenderTargetCube === true );
			var isTargetPowerOfTwo = isPowerOfTwo( renderTarget );

			// Setup framebuffer

			if ( isCube ) {

				renderTargetProperties.__webglFramebuffer = [];

				for ( var i = 0; i < 6; i ++ ) {

					renderTargetProperties.__webglFramebuffer[ i ] = _gl.createFramebuffer();

				}

			} else {

				renderTargetProperties.__webglFramebuffer = _gl.createFramebuffer();

			}

			// Setup color buffer

			if ( isCube ) {

				state.bindTexture( _gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture );
				setTextureParameters( _gl.TEXTURE_CUBE_MAP, renderTarget.texture, isTargetPowerOfTwo );

				for ( var i = 0; i < 6; i ++ ) {

					setupFrameBufferTexture( renderTargetProperties.__webglFramebuffer[ i ], renderTarget, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_CUBE_MAP_POSITIVE_X + i );

				}

				if ( textureNeedsGenerateMipmaps( renderTarget.texture, isTargetPowerOfTwo ) ) _gl.generateMipmap( _gl.TEXTURE_CUBE_MAP );
				state.bindTexture( _gl.TEXTURE_CUBE_MAP, null );

			} else {

				state.bindTexture( _gl.TEXTURE_2D, textureProperties.__webglTexture );
				setTextureParameters( _gl.TEXTURE_2D, renderTarget.texture, isTargetPowerOfTwo );
				setupFrameBufferTexture( renderTargetProperties.__webglFramebuffer, renderTarget, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D );

				if ( textureNeedsGenerateMipmaps( renderTarget.texture, isTargetPowerOfTwo ) ) _gl.generateMipmap( _gl.TEXTURE_2D );
				state.bindTexture( _gl.TEXTURE_2D, null );

			}

			// Setup depth and stencil buffers

			if ( renderTarget.depthBuffer ) {

				setupDepthRenderbuffer( renderTarget );

			}

		}

		function updateRenderTargetMipmap( renderTarget ) {

			var texture = renderTarget.texture;
			var isTargetPowerOfTwo = isPowerOfTwo( renderTarget );

			if ( textureNeedsGenerateMipmaps( texture, isTargetPowerOfTwo ) ) {

				var target = renderTarget.isWebGLRenderTargetCube ? _gl.TEXTURE_CUBE_MAP : _gl.TEXTURE_2D;
				var webglTexture = properties.get( texture ).__webglTexture;

				state.bindTexture( target, webglTexture );
				_gl.generateMipmap( target );
				state.bindTexture( target, null );

			}

		}

		function updateVideoTextures() {

			for ( var id in _videoTextures ) {

				_videoTextures[ id ].update();

			}

		}

		this.setTexture2D = setTexture2D;
		this.setTextureCube = setTextureCube;
		this.setTextureCubeDynamic = setTextureCubeDynamic;
		this.setupRenderTarget = setupRenderTarget;
		this.updateRenderTargetMipmap = updateRenderTargetMipmap;
		this.updateVideoTextures = updateVideoTextures;

	}

	exports.WebGLTextures = WebGLTextures;

	return exports;

}({}));
