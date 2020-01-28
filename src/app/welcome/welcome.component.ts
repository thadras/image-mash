import { ChangeDetectorRef, Component, OnInit, Input } from '@angular/core';
import { LoadImageService } from './../load-image.service';

//#region interfaces
interface Position {
  x: number;
  y: number;
}

interface Rectangle {
  upperLeft: Position;
  deminsions: Position;
}
//#endregion

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  // #region Data Members

  @Input()
  webUrl = '';
  imgFile: any;
  imgMime = '';

  receivedClick = false;
  imgDeminsions: Position = { x: 0, y: 0 };
  // FUTURE:  Possibly scale images selected via URL
  scaleDeminsions: Position = { x: 0, y: 0 };

  startPosition: Position = { x: 0, y: 0 };
  stopPosition: Position = { x: 0, y: 0 };
  imgSelection: Rectangle = {
    upperLeft: { x: 0, y: 0 },
    deminsions: { x: 0, y: 0 }
  };

  imgDataURI: string;
  imgFail = false;
  imgCanvas: HTMLCanvasElement;
  imgContext: CanvasRenderingContext2D | null;
  scaleValue = 1;
  scaledSelection = 0;
  image: any;
  imageToShow: any;
  isImageLoading: boolean;
  // #endregion

  constructor(
    private changeDetector: ChangeDetectorRef,
    private imageService: LoadImageService
  ) {}

  ngOnInit() {
    /* Suppose the onInit method is not necessary when no default asset file is being
     * loaded, but leaving it.  As it was only commented out since the URL won't load on
     * on StackBlitz, so when  unable to load it, there is an error message.
     */
    this.webUrl = './assets/img/hill.jpg';
    this.getImageFromService();
  }

  //#region Image selection via HammerJS pan events
  onPanStart(e) {
    const scroll = this.scrollOffset();
    this.receivedClick = true;
    e.preventDefault();
    this.startPosition.x =
      e.center.x - e.target.offsetLeft - e.deltaX + scroll[0];
    this.startPosition.y =
      e.center.y - e.target.offsetTop - e.deltaY + scroll[1];
  }

  onPanMove(e) {
    if (!this.receivedClick) { return; }
    const scroll = this.scrollOffset();
    e.preventDefault();
    this.stopPosition.x = this.startPosition.x + e.deltaX;
    this.stopPosition.y = this.startPosition.y + e.deltaY;
    // Lower boundary (top-left) checks for panning out of bounds
    this.stopPosition.x =
      this.startPosition.x + e.deltaX < 0 ? 1 : this.startPosition.x + e.deltaX;
    this.stopPosition.y =
      this.startPosition.y + e.deltaY < 0 ? 1 : this.startPosition.y + e.deltaY;

    this.resetCanvas();

    this.imgSelection.upperLeft.x = this.startPosition.x;
    this.imgSelection.upperLeft.y = this.startPosition.y;
    this.imgSelection.deminsions.x = this.stopPosition.x - this.startPosition.x;
    this.imgSelection.deminsions.y = this.stopPosition.y - this.startPosition.y;

    // Upper boundary (bottom-right) checks for panning out of bounds
    if (
      this.imgDeminsions.x <
      this.startPosition.x + this.imgSelection.deminsions.x
    ) {
      this.imgSelection.deminsions.x =
        this.imgDeminsions.x - this.startPosition.x;
    }
    if (
      this.imgDeminsions.y <
      this.startPosition.y + this.imgSelection.deminsions.y
    ) {
      this.imgSelection.deminsions.y =
        this.imgDeminsions.y - this.startPosition.y;
    }

    this.outlineRectangle();
  }

  onPanEnd(e) {
    this.receivedClick = false;
    e.preventDefault();
  }

  onTapped(evt) {
    this.receivedClick = false;
    window.scrollTo(0, 0);
  }

  //#endregion Image Hammer selection

  //#region Image Mouse selection and resets
  beginDrag(event) {
    this.receivedClick = true;
    const rect = this.imgCanvas.getBoundingClientRect();

    // Math.floor calls to ensure starting at a pixel to avoid rectangle in cropped image
    this.startPosition.x = this.stopPosition.x =
      Math.floor(event.clientX) - Math.floor(rect.left);
    this.startPosition.y = this.stopPosition.y =
      Math.floor(event.clientY) - Math.floor(rect.top);

    this.resetCanvas();

    const scroll = this.scrollOffset();
    console.groupCollapsed(
      'Selecting from Start %s Scroll %s Ev [%d, %d] Canvas %s',
      JSON.stringify(this.startPosition),
      JSON.stringify(scroll),
      event.clientX,
      event.clientY,
      JSON.stringify(rect)
    );
  }

  moving(event) {
    if (!this.receivedClick) {
      console.log('not clicked');
      return;
    }

    this.resetCanvas();
    const rect = this.imgCanvas.getBoundingClientRect();
    const scroll = this.scrollOffset();
    // Math.floor calls to ensure starting at a pixel to avoid rectangle in cropped image
    this.stopPosition.x = Math.floor(event.clientX) - Math.floor(rect.left);
    this.stopPosition.y = Math.floor(event.clientY) - Math.floor(rect.top);

    const dir = this.direction();
    this.outlineRectangle();
    /*
      console.log('Dragging  %s Ev[%d, %d], Canvas(%d, %d), Crop %s, Scroll %s',
        dir, event.clientX, event.clientY,
        rect.left, rect.top,
        JSON.stringify(this.imgSelection),
        JSON.stringify(scroll)
      );
    */
  }

  outlineRectangle() {
    this.imgContext.beginPath();

    this.imgContext.strokeStyle = 'red';
    if (this.scaledSelection) {
      /*
        console.log('Drawing scaled %s rect to %s from x %s y %s w %s h %s',
          this.scaledSelection,
          this.imgSelection.upperLeft.x / this.scaledSelection,
          this.imgSelection.upperLeft.y / this.scaledSelection,
          this.imgSelection.deminsions.x / this.scaledSelection,
          this.imgSelection.deminsions.y / this.scaledSelection
        );
      */
      this.imgContext.strokeRect(
        this.imgSelection.upperLeft.x / this.scaledSelection,
        this.imgSelection.upperLeft.y / this.scaledSelection,
        this.imgSelection.deminsions.x / this.scaledSelection,
        this.imgSelection.deminsions.y / this.scaledSelection
      );
    } else {
      /*
        console.log('Drawing rect from Start %s to Stop %s Selection %s',
          JSON.stringify(this.startPosition),
          JSON.stringify(this.stopPosition),
          JSON.stringify(this.imgSelection)
        );
      */
      this.imgContext.strokeRect(
        this.imgSelection.upperLeft.x,
        this.imgSelection.upperLeft.y,
        this.imgSelection.deminsions.x,
        this.imgSelection.deminsions.y
      );
    }
  }

  direction(): string {
    if (
      this.startPosition.x === this.stopPosition.x ||
      this.startPosition.y === this.stopPosition.y
    ) {
      return 'Line';
    }

    const scroll = this.scrollOffset();
    const descending = this.startPosition.y > this.stopPosition.y;
    const backwards = this.startPosition.x > this.stopPosition.x;
    this.imgSelection.deminsions.x = Math.abs(
      this.stopPosition.x - this.startPosition.x
    );
    this.imgSelection.deminsions.y = Math.abs(
      this.stopPosition.y - this.startPosition.y
    );
    if (backwards && descending) {
      this.imgSelection.upperLeft.x = this.stopPosition.x;
      this.imgSelection.upperLeft.y = this.stopPosition.y;
      return 'Bottom-Right to Top-Left';
    }

    if (backwards && !descending) {
      this.imgSelection.upperLeft.x = this.stopPosition.x;
      this.imgSelection.upperLeft.y = this.startPosition.y;
      return 'Top-Right to Bottom-Left';
    }

    if (!backwards && !descending) {
      this.imgSelection.upperLeft.x = this.startPosition.x;
      this.imgSelection.upperLeft.y = this.startPosition.y;
      return 'Top-Left to Bottom-Right';
    }

    if (!backwards && descending) {
      this.imgSelection.upperLeft.x = this.startPosition.x;
      this.imgSelection.upperLeft.y = this.stopPosition.y;
      return 'Bottom-Left to Top-Right';
    }
  }

  endDrag(event) {
    if (this.receivedClick) {
      this.receivedClick = false;
      const dir = this.direction();
      /* Close console output group of selection dragging
        console.groupEnd();
        console.log('Finished selection at %s with direction %s',
          JSON.stringify(this.stopPosition), dir);
      */
      this.changeDetector.detectChanges();
    }
  }

  scrollOffset(): any[] {
    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    return top || left ? [Math.floor(left), Math.floor(top)] : [0, 0];
  }

  resetImage() {
    this.resetCanvas();
    this.image = null;
    this.imgDeminsions.y = this.imgDeminsions.x = 0;
    this.imgContext = null;
    this.imgFail = false;
    this.webUrl = '';
    this.scaledSelection = 0;

    if (this.imageToShow) {
      this.imageToShow = null;
    }
  }

  resetCanvas() {
    if (this.imgContext) {
      this.imgContext.clearRect(
        0,
        0,
        this.imgCanvas.width,
        this.imgCanvas.height
      );
    }

    this.imgSelection.deminsions.x = this.imgSelection.deminsions.y = 0;
    this.scaleValue = 1;

    if (this.imgContext) {
      this.imgContext.drawImage(this.image, 0, 0);
    }

    this.changeDetector.detectChanges();
  }
  //#endregion

  //#region View Handlers

  getImageFromService() {
    if (!this.webUrl) {
      console.error('No image has been selected!');
      return;
    }

    if (this.imgContext) {
      this.resetCanvas();
    }

    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.src = this.webUrl;

    this.isImageLoading = true;
    this.imageService.getImage(this.webUrl).subscribe(
      data => {
        this.createImageFromBlob(data);
        this.isImageLoading = false;
      },
      error => {
        this.isImageLoading = false;
        this.imgFail = true;
        console.error(error);
      }
    );
  }

  readImageFromUser(imageFile) {
    this.resetImage(); // Clear current image
    if (this.imgContext) {
      this.resetCanvas(); // and the canvas
    }
    // Check for the various File API support.
    if (
      window['File'] &&
      window['FileReader'] &&
      window['FileList'] &&
      window['Blob']
    ) {
      console.log('You selected the file %d', imageFile.target.files[0]);
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        this.doFileRead.bind(this, reader),
        false
      );
      reader.readAsDataURL(imageFile.target.files[0]);
      this.imgMime = imageFile.target.files[0].type;
    } else {
      alert('Your browser is too old to support necessary HTML5 APIs');
    }
  }

  cropImage() {
    // Deminsion calc depends on UX of  touch (HammerJS) or  Mouse Click
    const w =
      this.stopPosition.x > this.imgDeminsions.x
        ? this.imgSelection.deminsions.x
        : Math.abs(this.stopPosition.x - this.startPosition.x);
    const h =
      this.stopPosition.y > this.imgDeminsions.y
        ? this.imgSelection.deminsions.y
        : Math.abs(this.stopPosition.y - this.startPosition.y);

    const canvasCrop = document.createElement('canvas');
    // Hard-coded offsets adjust size to remove the rectangle from the cropped image
    canvasCrop.width = w - 2;
    canvasCrop.height = h - 2;

    /* HammerJS panned selections do not stop returning events when out-of-bounds
     * such that the UL corner is not necessarily the upper left corner.  Hence,
     * the below if-blocks adjust such OOB corner-cases for negative deminsions
     * so as to work with the getImageData() offset for mouse-clicks
     */
    if (this.imgSelection.deminsions.x < 0) {
      this.imgSelection.deminsions.x += 2;
      this.imgSelection.upperLeft.x--;
    }

    if (this.imgSelection.deminsions.y < 0) {
      this.imgSelection.deminsions.y += 2;
      this.imgSelection.upperLeft.y--;
    }

    // Below hard code-offsets are added to remove the image selection rectangle
    const imageData = this.imgContext.getImageData(
      this.imgSelection.upperLeft.x + 1,
      this.imgSelection.upperLeft.y + 1,
      this.imgSelection.deminsions.x - 1,
      this.imgSelection.deminsions.y - 1
    );
    console.log('crop imgSelection %s', JSON.stringify(this.imgSelection));
    const contextCrop = canvasCrop.getContext('2d');
    contextCrop.fillStyle = 'white';
    contextCrop.fill();
    contextCrop.putImageData(imageData, 0, 0);

    this.imageToShow = canvasCrop.toDataURL(this.imgMime);
  }

  // View conditional for downloading file which may have URI too large
  largeImage() {
    return (
      this.imgFail &&
      ((this.imageToShow &&
        this.imageToShow.length &&
        this.imageToShow.length / (1024 * 1024) > 2) ||
        (this.imgDataURI &&
          this.imgDataURI.length &&
          this.imgDataURI.length / (1024 * 1024) > 2))
    );
  }

  // View handlers for scaling a selected image
  enlarge() {
    this.scaleImage(1, 0.8);
    this.drawScaledImage();
  }
  shrink() {
    this.scaleImage(0, 0.8);
    this.drawScaledImage();
  }
  scaleImage(scale, value) {
    this.scaleValue = scale ? this.scaleValue / value : this.scaleValue * value;

    // Use of Math.floor to keep from image having black trim for partial pixel
    this.scaleDeminsions.x = Math.floor(this.imgDeminsions.x * this.scaleValue);
    this.scaleDeminsions.y = Math.floor(this.imgDeminsions.y * this.scaleValue);
  }
  drawScaledImage() {
    const canvasScale = document.getElementById(
      'scaledCanvas'
    ) as HTMLCanvasElement;
    const contextScale = canvasScale.getContext('2d');
    canvasScale.width = this.scaleDeminsions.x;
    canvasScale.height = this.scaleDeminsions.y;
    // clear canvas
    contextScale.scale(this.scaleValue, this.scaleValue);
    contextScale.drawImage(this.image, 0, 0);
    this.imageToShow = canvasScale.toDataURL(this.imgMime);
    this.changeDetector.detectChanges();
  }

  saveImage(source) {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      source === 'edit' ? this.imageToShow : this.image.src
    );

    let ext = '';
    switch (this.imgMime) {
      case 'image/gif':
        ext = 'gif';
        break;
      case 'image/jpeg':
        ext = 'jpg';
        break;
      case 'image/webp':
        ext = 'webp';
        break;
      case 'image/bmp':
        ext = 'bmp';
        break;
      case 'image/png':
      default:
        ext = 'png';
        break;
    }
    element.type = this.imgMime;
    // FUTURE: Set dynamic file name based off selected file or url
    element.setAttribute(
      'download',
      source === 'file' ? 'loadedImage.' + ext : 'editedImage.' + ext
    );
    document.body.appendChild(element);
    if (element.href.length > 2 ** 11) {
      this.imgFail = true;
    }
    console.log(
      'set file name %s, URI length %d',
      element.download,
      element.href.length
    );
    element.click();
    document.body.removeChild(element);
  }

  //#endregion View Handlers

  //#region Image generation
  createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    const type = image.type.split('/');
    if ('image' !== type[0]) {
      this.imgFail = true;
      return;
    }
    this.imgMime = image.type;
    reader.addEventListener('load', this.doFileRead.bind(this, reader), false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  doFileRead(reader) {
    this.resetImage();
    this.image = new Image();
    this.image.src = reader.result as string;
    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    const vh = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );
    this.image.addEventListener('load', () => {
      console.log(
        'loaded the image type %s  with w: %d by h: %d',
        this.imgMime,
        this.image.width,
        this.image.height
      );

      let scale = 1;
      this.isImageLoading = true;
      if (vw < this.image.width && vh < this.image.height) {
        scale = Math.max(vw / this.image.width, vh / this.image.height);
        console.log('scale factor of  %s for viewport %s %s', scale, vw, vh);
        this.scaleImage(0, scale); // Changes image Deminisions
        this.scaledSelection = this.scaleValue;
        this.imgDeminsions.x = this.scaleDeminsions.x = Math.floor(
          this.image.width * scale
        );
        this.imgDeminsions.y = this.scaleDeminsions.y = Math.floor(
          this.image.height * scale
        );
      } else {
        this.imgDeminsions.x = this.scaleDeminsions.x = this.image.width;
        this.imgDeminsions.y = this.scaleDeminsions.y = this.image.height;
      }
      this.imgCanvas = document.getElementById(
        'canvasImage'
      ) as HTMLCanvasElement;
      this.changeDetector.detectChanges();
      this.imgContext = this.imgCanvas.getContext('2d');
      this.imgContext.scale(scale, scale);
      this.imgContext.drawImage(this.image, 0, 0);
    });
    this.imgDataURI = reader.result as string;
  }

  //#endregion Image generation
}
