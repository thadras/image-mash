# ImageMash

Angular Client application that performs client side image manipulations that include:

* Resize Image
* Crop Image
* Save Image

All image manipulation is done on a HTML5 Canvas that is rendered in an Image, and able to be saved via a Blob data URI.  In addition, to selecting a user's file, the interface allows input of an URL, which may be loaded into the browser when

* Remote host supports cross-origin requests
* URL loads a file with mime-type image 

Try the app out on [StackBlitz](https://stackblitz.com/github/thadras/image-mash).  Use the `Open in New Window LIVE` button in the upper, right corner for a better preview of the application's capabilities.


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.19.


## Known issues
* Attempts to save images via the interface may result in `Failed Network Error` for large image files.  In particular, Chrome seems to limit saving data URI blobs at 2MB.  Nonetheless, using the context-menu (right-mouse click), the image can likely be saved with the `Save image as...` action.
* Mobile users are currently unable to crop images, since there is no touch support implemented.  
* UX for large images requires panning, scrolling, or changing zoom level for better usability.

## Future
Additional support for [HammerJS](https://hammerjs.github.io) to better support mobile devices, which can improve UI/UX.  In addition, such would potentially allow for mobile users to crop images. 
