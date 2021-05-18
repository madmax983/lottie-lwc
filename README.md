<a href="https://githubsfdeploy.herokuapp.com?owner=madmax983&repo=lottie-lwc&ref=main">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

![gif of lottie-player](/assets/present.gif "Lottie Player Gif")
## Table of Contents

-   [Description](#description)
-   [Lottie-Player](#lottie-player)

## Description

"Lottie is an open source animation file format that’s tiny, high quality, interactive, and can be manipulated at runtime." LottieFiles (https://lottiefiles.com) are a great way to add animation to your web and mobile apps. This component allows you to use LottieFiles in LWC, and exposes Target Configs so that it can be setup declaritively from App Builder, Experience Builder, or Flow Builder. Prior art for lottie files in a web component can be found here (https://github.com/LottieFiles/lottie-player), and this component is mostly a translation of that Web Component into LWC.

## Lottie-Player

Lottie-Player exposes several public attributes

- autoplay: Auto Plays the animation on load
- background: Background color. Accepts any valid valiue that the CSS property does.
- controls: Shows the playback controls for the animation.
- hover: Plays the animation on hover.
- loop: Determines whether to loop the animation.
- mode: Normal or Bounce. Bounce will play the animation once, and then again in reverse.
- renderer: Either SVG or Canvas
- speed: Controls the speed of the animation.
- Src: LottieFiles JSON data or URL to JSON. The JSON Data itself proves to be pretty difficult to import directly because of the LWC size constraints. It is best to import via URL. Either have the LottieFile JSON at a CDN (or LottieFiles.com) and add that URL as a CSP Trusted Site OR load the JSON into a static resource and add /resource/*/staticResourceName.

