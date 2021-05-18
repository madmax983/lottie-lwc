import { LightningElement, api } from 'lwc';
import {loadScript} from 'lightning/platformResourceLoader';

import lottieJS from '@salesforce/resourceUrl/lottie';

// Define valid player states
const PlayerState = {
    Loading: "loading",
    Playing: "playing",
    Paused: "paused",
    Stopped: "stopped",
    Frozen: "frozen",
    Error: "error",
}

// Define play modes
const PlayMode = {
    Normal: "normal",
    Bounce: "bounce",
}

// Define player events
const PlayerEvents = {
    Load: "load",
    Error: "error",
    Ready: "ready",
    Play: "play",
    Pause: "pause",
    Stop: "stop",
    Freeze: "freeze",
    Loop: "loop",
    Complete: "complete",
    Frame: "frame",
}

/**
 * Parse a resource into a JSON object or a URL string
 */
function parseSrc(src) {
    if (typeof src === "object") {
        return src;
    }
  
    try {
        return JSON.parse(src);
    } catch (e) {
        // Try construct an absolute URL from the src URL
        const srcUrl = new URL(src, window.location.href);
  
        return srcUrl.toString();
    }
}

export default class lottiePlayer extends LightningElement {
    @api mode = PlayMode.Normal;
    @api autoplay = false;
    @api background = "transparent";
    @api controls = false;
    @api count;
    @api direction = 1;
    @api hover = false;
    @api loop = false;
    @api preserveAspectRatio = "xMidYMid meet";
    @api renderer = "svg";
    @api height;
    @api width;
    @api speed = 1;
    @api src;
    @api currentState = PlayerState.Loading;
    @api seeker;
    @api intermission = 1;
    @api description = "lottie animation";

    container;
    _lottie;
    _prevState;
    _counter = 0;
    _loaded = false;

    renderedCallback() {
        if(!this.loaded) {
            loadScript(this, lottieJS + '/lottie.js').then(() => {
                this.firstUpdated();
                this.loaded = true;
            })
        }
    }

    _onVisibilityChange() {
        if (document.hidden === true && this.currentState === PlayerState.Playing) {
            this.freeze();
        } else if (this.currentState === PlayerState.Frozen) {
            this.play();
        }
    }

    handleSeekChange() {
        if (!this._lottie || isNaN(e.target.value)) {
            return;
        }
      
        const frame = (e.target.value / 100) * this._lottie.totalFrames;
      
        this.seek(frame);
    }

    handleSeekMouseDown() {
        this._prevState = this.currentState;
        this.freeze();
    }

    handleSeekMouseUp() {
        this._prevState === PlayerState.Playing && this.play();
    }

    load(src) {
        this.container = this.template.querySelector('.animation');
        const options = {
            container: this.container,
            loop: false,
            autoplay: false,
            renderer: this.renderer,
            rendererSettings: {
                preserveAspectRatio: this.preserveAspectRatio,
                clearCanvas: false,
                progressiveLoad: true,
                hideOnTransparent: true,
            },
        };

        try {
            const srcParsed = parseSrc(src);
            const srcAttrib =
                typeof srcParsed === "string" ? "path" : "animationData";
      
            // Clear previous animation, if any
            if (this._lottie) {
                this._lottie.destroy();
            }

            this._lottie = lottie.loadAnimation({
                ...options,
                [srcAttrib]: srcParsed,
            });
        } catch (err) {
            this.currentState = PlayerState.Error;
        
            this.dispatchEvent(new CustomEvent(PlayerEvents.Error));
            return;
        }

        if (this._lottie) {
            // Calculate and save the current progress of the animation
            this._lottie.addEventListener("enterFrame", () => {
                this.seeker =
                    (this._lottie.currentFrame / this._lottie.totalFrames) * 100;
        
                this.dispatchEvent(
                    new CustomEvent(PlayerEvents.Frame, {
                        detail: {
                            frame: this._lottie.currentFrame,
                            seeker: this.seeker,
                        }
                    })
                );
            });
        
            // Handle animation play complete
            this._lottie.addEventListener("complete", () => {
                if (this.currentState !== PlayerState.Playing) {
                    this.dispatchEvent(new CustomEvent(PlayerEvents.Complete));
                    return;
                }
        
                if (!this.loop || (this.count && this._counter >= this.count)) {
                    this.dispatchEvent(new CustomEvent(PlayerEvents.Complete));
                    return;
                }
        
                if (this.mode === PlayMode.Bounce) {
                    if (this.count) {
                        this._counter += 0.5;
                    }
        
                    setTimeout(() => {
                        this.dispatchEvent(new CustomEvent(PlayerEvents.Loop));
        
                        if (this.currentState === PlayerState.Playing) {
                            this._lottie.setDirection(this._lottie.playDirection * -1);
                            this._lottie.play();
                        }
                    }, this.intermission);
                } else {
                    if (this.count) {
                        this._counter += 1;
                    }
        
                    window.setTimeout(() => {
                        this.dispatchEvent(new CustomEvent(PlayerEvents.Loop));
        
                        if (this.currentState === PlayerState.Playing) {
                            this._lottie.stop();
                            this._lottie.play();
                        }
                    }, this.intermission);
                }
            });
        
            // Handle lottie-web ready event
            this._lottie.addEventListener("DOMLoaded", () => {
                this.dispatchEvent(new CustomEvent(PlayerEvents.Ready));
            });
        
            // Handle animation data load complete
            this._lottie.addEventListener("data_ready", () => {
                this.dispatchEvent(new CustomEvent(PlayerEvents.Load));
            });
        
            // Set error state when animation load fail event triggers
            this._lottie.addEventListener("data_failed", () => {
                this.currentState = PlayerState.Error;
        
                this.dispatchEvent(new CustomEvent(PlayerEvents.Error));
            });
        
            // Set handlers to auto play animation on hover if enabled
            this.container.addEventListener("mouseenter", () => {
                if (this.hover && this.currentState !== PlayerState.Playing) {
                    this.play();
                }
            });
            this.container.addEventListener("mouseleave", () => {
                if (this.hover && this.currentState === PlayerState.Playing) {
                    this.stop();
                }
            });
        
            // Set initial playback speed and direction
            this.setSpeed(this.speed);
            this.setDirection(this.direction);
        
            // Start playing if autoplay is enabled
            if (this.autoplay) {
                this.play();
            }
        }
    }

    /**
     * Returns the lottie-web instance used in the component.
    */
    @api
    get lottie() {
        return this._lottie;
    }

    /**
    * Start playing animation.
    */
    @api 
    play() {
        if (!this._lottie) {
            return;
        }

        this._lottie.play();
        this.currentState = PlayerState.Playing;

        this.dispatchEvent(new CustomEvent(PlayerEvents.Play));
    }

    /**
    * Pause animation play.
    */
    @api 
    pause() {
        if (!this._lottie) {
            return;
        }

        this._lottie.pause();
        this.currentState = PlayerState.Paused;

        this.dispatchEvent(new CustomEvent(PlayerEvents.Pause));
    }

    /**
    * Stops animation play.
    */
    @api 
    stop() {
        if (!this._lottie) {
        return;
        }

        this._counter = 0;
        this._lottie.stop();
        this.currentState = PlayerState.Stopped;

        this.dispatchEvent(new CustomEvent(PlayerEvents.Stop));
    }

    /**
    * Seek to a given frame.
    */
    @api 
    seek(value) {
        if (!this._lottie) {
            return;
        }

        // Extract frame number from either number or percentage value
        const matches = value.toString().match(/^([0-9]+)(%?)$/);
        if (!matches) {
            return;
        }

        // Calculate and set the frame number
        const frame =
            matches[2] === "%"
                ? (this._lottie.totalFrames * Number(matches[1])) / 100
                : Number(matches[1]);

        // Set seeker to new frame number
        this.seeker = frame;

        // Send lottie player to the new frame
        if (this.currentState === PlayerState.Playing) {
            this._lottie.goToAndPlay(frame, true);
        } else {
            this._lottie.goToAndStop(frame, true);
            this._lottie.pause();
        }
    }

    /**
    * Snapshot the current frame as SVG.
    *
    * If 'download' argument is boolean true, then a download is triggered in browser.
    */
    @api
    snapshot(download = true) {

        // Get SVG element and serialize markup
        const svgElement = this.template.querySelector(".animation svg");
        const data = new XMLSerializer().serializeToString(svgElement);

        // Trigger file download
        if (download) {
            const element = document.createElement("a");
            element.href =
                "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
            element.download = "download_" + this.seeker + ".svg";
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }

        return data;
    }

    /**
    * Freeze animation play.
    * This internal state pauses animation and is used to differentiate between
    * user requested pauses and component instigated pauses.
    */
    freeze() {
        if (!this._lottie) {
            return;
        }

        this._lottie.pause();
        this.currentState = PlayerState.Frozen;

        this.dispatchEvent(new CustomEvent(PlayerEvents.Freeze));
    }

    /**
    * Sets animation play speed.
    *
    * @param value Playback speed.
    */
    @api
    setSpeed(value = 1){
        if (!this._lottie) {
        return;
        }

        this._lottie.setSpeed(value);
    }

    /**
    * Animation play direction.
    *
    * @param value Direction values.
    */
    @api
    setDirection(value) {
        if (!this._lottie) {
            return;
        }

        this._lottie.setDirection(value);
    }

    /**
    * Sets the looping of the animation.
    *
    * @param value Whether to enable looping. Boolean true enables looping.
    */
    @api
    setLooping(value) {
        if (this._lottie) {
            this.loop = value;
            this._lottie.loop = value;
        }
    }

    /**
    * Toggle playing state.
    */
    @api
    togglePlay() {
        return this.currentState === PlayerState.Playing
            ? this.pause()
            : this.play();
    }

    /**
    * Toggles animation looping.
    */
    @api
    toggleLooping() {
        this.setLooping(!this.loop);
    }

    /**
     * Resize animation.
     */
    @api
    resize() {
        if (!this._lottie) {
            return;
        }

        this._lottie.resize();
    }

    /**
     * Returns the styles for the component.
     */
    static get styles() {
        return styles;
    }

    /**
     * Initialize everything on component first render.
     */
    firstUpdated() { 
        // Add intersection observer for detecting component being out-of-view.
        if ("IntersectionObserver" in window) {
            this._io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (this.currentState === PlayerState.Frozen) {
                        this.play();
                    }
                } else if (this.currentState === PlayerState.Playing) {
                    this.freeze();
                }
            });

            this._io.observe(this.container);
        }

        // Add listener for Visibility API's change event.
        if (typeof document.hidden !== "undefined") {
            document.addEventListener("visibilitychange", () =>
                this._onVisibilityChange()
            );
        }

        // Setup lottie player
        if (this.src) {
            this.load(this.src);
        }
    }

    get computedPlayButtonClass() {
        return this.isPlaying || this.isPaused ? "active" : "";
    }

    get computedStopButtonClass() {
        return this.isStopped ? "active" : "";
    }

    get computedLoopButtonClass() {
        return this.loop ? "active" : "";
    }

    get computedContainerStyle() {
        return `background:${this.background}`;
    }

    get computedMainStyle() {
        let result = '';
        if(this.height) {
            result += `height:${this.height}px;`;
        }
        if(this.width) {
            result += `width:${this.width}px;`;
        }
        return result;
    }

    get isPlaying() {
        this.currentState === PlayerState.Playing;
    }

    get isPaused() {
        this.currentState === PlayerState.Paused;
    }

    get isStopped() {
        this.currentState === PlayerState.Stopped;
    }

    /**
     * Cleanup on component destroy.
     */
    disconnectedCallback() {
        // Remove intersection observer for detecting component being out-of-view.
        if (this._io) {
            this._io.disconnect();
            this._io = undefined;
        }

        // Remove resize observer for detecting resize/reflow events affecting element.
        // if (this._ro) {
        //   this._ro.disconnect();
        //   this._ro = undefined;
        // }

        // Remove the attached Visibility API's change event listener.
        document.removeEventListener("visibilitychange", () =>
            this._onVisibilityChange()
        );
    }
}