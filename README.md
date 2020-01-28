# ImageMash

Angular Client application that performs client side image manipulations that include:

* Resize Image
* Crop Image
* Save Image

Additional enhancements as follows:
* [HammerJS](https://hammerjs.github.io) adds touch support for devices to improve UI/UX.
* Selecting large image files are now scaled to present better within the viewport
* Device users can tap the selected image to return the view to top

All image manipulation is done on a HTML5 Canvas that is rendered in an Image, and is able to be saved via a Blob data URI.  In addition, to selecting a user's file, the interface allows input of an URL, which may be loaded into the browser when

* Remote host supports cross-origin requests
* URL loads a file with mime-type image 

Try the app out on [GitHub](https://thadras.github.io/image-mash/) or [StackBlitz](https://stackblitz.com/github/thadras/image-mash).  On StackBlitz, use the `Open in New Window LIVE` button in the upper, right corner for a better preview of the application's capabilities.


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.19.


## Known issues
* Attempts to save images via the interface may result in `Failed Network Error` for large image files.  In particular, Chrome seems to limit saving data URI blobs at 2MB.  Nonetheless, using the context-menu (right-mouse click), the image can likely be saved with the `Save image as...` action.
* UX for devices with large images while panning cannot scroll, but rotating device hay have better usability.
* Device users that tap the image might experience [ghost clicks](http://hammerjs.github.io/tips/#after-a-tap-also-a-click-is-being-triggered-i-dont-want-that)

## Future
* Additional support for scaling large images selected by URL
* Use dynamic filenames when saving image.
