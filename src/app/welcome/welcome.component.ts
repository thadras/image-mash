import { ChangeDetectorRef, Component, OnInit, Input } from '@angular/core';
import { LoadImageService } from './../load-image.service';

//#region interfaces
interface Position {
  y: number;
  x: number;

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

  // #region Members
  imgUrl: string;
  @Input()
  webUrl: string = 'assets/img/hills.jpg';
  imgFile: any;
  imgMime = '';
  imgFail = false;
  receivedClick = false;
  imgDeminsions: Position = { y: 0, x: 0 };
  scaleDeminsions: Position = { y: 0, x: 0 };

  startPosition: Position = { y: 0, x: 0 };
  stopPosition: Position = { y: 0, x: 0 };
  imgSelection: Rectangle = {
    upperLeft: { y: 0, x: 0 },
    deminsions: { y: 0, x: 0 }
  };

  imgCanvas: HTMLCanvasElement;
  imgContext: CanvasRenderingContext2D | null;
  rectCanvas: HTMLCanvasElement;
  rectContext: CanvasRenderingContext2D | null;
  scaleValue = 1;
  scaled = false;
  image: any;
  imageToShow: any;
  isImageLoading: boolean;
  // #endregion

  constructor(private changeDetector: ChangeDetectorRef,
              private imageService: LoadImageService) {  }

  ngOnInit() {
    this.getImageFromService();
  }

  //#region Image selection and reseting

  beginDrag(event) {

    this.receivedClick = true;
    const rect = this.imgCanvas.getBoundingClientRect();

    // ParseInt calls to ensure we start at a pixel to avoid rectangle in cropped image
    this.startPosition.x = this.stopPosition.x = parseInt(event.clientX.toString()) - parseInt(rect.left.toString());
    this.startPosition.y = this.stopPosition.y = parseInt(event.clientY.toString()) - parseInt(rect.top.toString());

    if (!this.rectCanvas) {
      this.rectCanvas = document.getElementById('canvasImage') as HTMLCanvasElement;
      this.rectContext = this.rectCanvas.getContext('2d');
    }
    this.resetCanvas();

    console.groupCollapsed('started dragging from %d x %d',
         this.startPosition.x, this.startPosition.y);
    const scroll: any[] = this.scrollOffset();
    console.groupEnd();

  }

  moving(event) {

    if (!this.receivedClick) { return; }

    const rect = this.imgCanvas.getBoundingClientRect();
    // ParseInt calls to ensure we start at a pixel to avoid rectangle in cropped image
    this.stopPosition.y = parseInt(event.pageY.toString()) - parseInt(rect.top.toString());
    this.stopPosition.x = parseInt(event.pageX.toString()) - parseInt(rect.left.toString());
    this.resetCanvas();
    this.rectContext.beginPath();
    const moveUp = this.startPosition.y > this.stopPosition.y;
    const moveForward = this.startPosition.x > this.stopPosition.x;
    const x = (this.startPosition.x > this.stopPosition.x) ? this.stopPosition.x : this.startPosition.x;
    const y = (this.startPosition.y > this.stopPosition.y) ?  this.stopPosition.y : this.startPosition.y ;
    const w = (this.stopPosition.x > this.startPosition.x) ? this.stopPosition.x - this.startPosition.x
      : this.startPosition.x - this.stopPosition.x;
    const h = (this.stopPosition.y > this.startPosition.y) ? this.stopPosition.y - this.startPosition.y
      : this.startPosition.y - this.stopPosition.y;
    const scroll = this.scrollOffset();
    // console.log('drag-rect from O(%d, %d) to C(%d, %d) rect (%d, %d, %d, %d)', this.startPosition.left,
    //  this.startPosition.top, this.stopPosition.left, this.stopPosition.top, x, y, w, h);

    this.imgSelection.upperLeft.x = x;
    this.imgSelection.upperLeft.y =  y;
    this.imgSelection.deminsions.x = (!scroll.length) ? w : w - scroll[0];
    this.imgSelection.deminsions.y = (!scroll.length) ? h : h - scroll[1];
    this.rectContext.strokeRect(x, y, this.imgSelection.deminsions.x, this.imgSelection.deminsions.y);

  }

  direction(): string {
    const ascending = this.startPosition.y > this.stopPosition.y;
    const backwards = this.startPosition.x > this.stopPosition.x;
  
      if (backwards && ascending) {
        return 'Bottom-Right to Top-Left';
      }

      if (backwards && !ascending) {
        return 'Top-Right to Bottom-Left';
      }

      if (!backwards && !ascending) {
        return 'Top-Left to Bottom-Right';
      }

      if (!backwards && ascending) {
        return 'Bottom-Left to Top-Right';
      }
  }
  endDrag(event) {
    if (this.receivedClick) {
      this.receivedClick = false;
     console.groupCollapsed('Moved from %s', this.direction());
      
      console.log('finished dragging at %d x %d',
        this.stopPosition.x, this.stopPosition.y);
      console.log(this.imgSelection);
      this.scrollOffset();
      console.groupEnd();
      this.changeDetector.detectChanges();
    }
  }

  scrollOffset(): any[] {
    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    return (top || left) ? [left, top] : [];

  }

  resetImage() {
    this.resetCanvas();
    this.image = null;
    this.imgDeminsions.y = this.imgDeminsions.x = 0;
    this.imgContext = null;
    this.imgFail = false;
    this.imgUrl = ''
  }

  resetCanvas() {
    if (this.rectContext) {
      this.rectContext.clearRect(0, 0, this.rectCanvas.width, this.rectCanvas.height);
    }
    if (this.imageToShow) {
      this.imageToShow = null;
    }

    this.imgSelection.deminsions.x = this.imgSelection.deminsions.y = 0;
    this.scaleValue = 1;

    if (this.imgContext) {
      this.imgContext.drawImage(this.image, 0, 0);
    }

    this.changeDetector.detectChanges();
  }
  //#endregion

  //#region Image generation
  createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    const type = image.type.split('/');
    if ('image' !== type[0]) {
      this.imgFail = true;
      return;
    }
    console.log('createImageFromBlob type is %s', image.type);
    this.imgMime = image.type;
    reader.addEventListener('load', this.doFileRead.bind(this, reader), false);

    if (image) {
       reader.readAsDataURL(image);
    }
  }

  readImageFromUser(imageFile) {
    console.groupCollapsed('User has selected an image!', imageFile);

    this.resetImage();  // Clear current image
    if (this.imgContext) {
      this.resetCanvas(); // and the canvas
    }
    // Check for the various File API support.
    if (window['File'] && window['FileReader'] && window['FileList'] && window['Blob']) {

        console.log('selected %d files', imageFile.target.files.length);
        const reader = new FileReader();
        reader.addEventListener('load', this.doFileRead.bind(this, reader), false);
        console.log(imageFile.target.files[0]);
        reader.readAsDataURL(imageFile.target.files[0]);
        this.imgMime = imageFile.target.files[0].type;

        console.groupEnd();

    } else {
        alert('Your browser is too old to support necessary HTML5 APIs');
    }
  }

  doFileRead(reader) {
    this.resetImage();
    this.image = new Image();
    this.image.src = reader.result as string;
    this.image.addEventListener('load', () => {

      console.groupCollapsed('loaded the image type %s  with w: %d by h: %d', this.imgMime, this.image.width, this.image.height);
      this.isImageLoading = true;
      this.imgDeminsions.y = this.scaleDeminsions.y = this.image.height;
      this.imgDeminsions.x = this.scaleDeminsions.x = this.image.width;
      this.imgCanvas = document.getElementById('canvasImage') as HTMLCanvasElement;
      this.changeDetector.detectChanges();
      this.imgContext = this.imgCanvas.getContext('2d');
      console.log('canvas is now %d x %d', this.imgDeminsions.y, this.imgDeminsions.x);
      this.imgContext.drawImage(this.image, 0, 0);
      console.groupEnd();
    });
    this.imgUrl = reader.result as string;
    console.log('read the file its length is %s', this.imgUrl.length);
  }

  getImageFromService() {
      if (!this.webUrl) {
        console.error('No image has been selected!');
        console.log(this.webUrl);
        return;
      }

      if (this.imgContext) {
          this.resetCanvas();
        }

      this.image = new Image();
      this.image.crossOrigin = 'anonymous';
      this.image.src = this.webUrl;


      this.isImageLoading = true;
      this.imageService.getImage(this.webUrl).subscribe(data => {

        this.createImageFromBlob(data);
        this.isImageLoading = false;
      }, error => {
        this.isImageLoading = false;
        this.imgFail = true;
        console.error(error);
      });
  }
//#endregion

  cropImage() {
    const canvasCrop = document.createElement('canvas');
    // Hard-coded offsets are to remove the rectangle from the cropped image
    canvasCrop.width = this.imgSelection.deminsions.x - 2;
    canvasCrop.height = this.imgSelection.deminsions.y - 2;

    const imageData = this.imgContext.getImageData(this.imgSelection.upperLeft.x + 1, this.imgSelection.upperLeft.y + 1,
      this.imgSelection.deminsions.x - 1, this.imgSelection.deminsions.y - 1);
    console.log('crop from %s %s to size %s %s', this.imgSelection.upperLeft.x + 1, this.imgSelection.upperLeft.y + 1,
        this.imgSelection.deminsions.x - 1, this.imgSelection.deminsions.y - 1);
    const contextCrop = canvasCrop.getContext('2d');
    contextCrop.fillStyle = 'white';
    contextCrop.fill();
    contextCrop.putImageData(imageData, 0, 0);

    this.imageToShow = canvasCrop.toDataURL(this.imgMime);
    console.log('Cropped image size is %d', this.imageToShow.length)
  }

  scaleImage(scale) {
    const canvasScale = document.getElementById('scaledCanvas') as HTMLCanvasElement;
    const contextScale = canvasScale.getContext('2d');

    // Use of Math.floor to keep from image having black trim for partial pixel
    if (scale) {
      this.scaleValue /= 0.8;
      this.scaleDeminsions.x = canvasScale.width = Math.floor(this.imgDeminsions.x * this.scaleValue);
      this.scaleDeminsions.y  = canvasScale.height = Math.floor(this.imgDeminsions.y * this.scaleValue);
    } else {
      this.scaleValue *= 0.8;
      this.scaleDeminsions.x = canvasScale.width = Math.floor(this.imgDeminsions.x * this.scaleValue);
      this.scaleDeminsions.y  = canvasScale.height = Math.floor(this.imgDeminsions.y * this.scaleValue);
    }

    // clear canvas
    contextScale.scale(this.scaleValue, this.scaleValue);
    contextScale.drawImage(this.image, 0, 0);
    this.imageToShow = canvasScale.toDataURL(this.imgMime);
    this.changeDetector.detectChanges();

  }

  saveImage(source) {
    const element = document.createElement('a');
    element.setAttribute('href', (source === 'edit') ? this.imageToShow : this.image.src);

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
      case  'image/png':
      default:
          ext = 'png';
          break;
    }
    element.type = this.imgMime;
    element.setAttribute('download', (source === 'file') ? 'loadedImage.' + ext : 'editedImage.' + ext);
    document.body.appendChild(element);
    if (element.href.length > 2 ** 11) {
      this.imgFail = true;
    }
    console.log('set file name %s, URI length %d', element.download, element.href.length);
    element.click();
    document.body.removeChild(element);
  }
}
