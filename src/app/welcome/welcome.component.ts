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

  // #region Members
  imgUrl: string;
  @Input()
  webUrl: string = 'assets/img/hills.jpg';
  imgFile: any;
  imgMime = '';
  imgFail: boolean = false;
  receivedClick = false;
  imgDeminsions: Position = { x: 0, y: 0 };
  scaleDeminsions: Position = { x: 0, y: 0 };

  startPosition: Position = { x: 0, y: 0 };
  stopPosition: Position = { x: 0, y: 0 };
  imgSelection: Rectangle = {
    upperLeft: { x: 0, y: 0 },
    deminsions: { x: 0, y: 0 }
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
    } else {
      this.resetCanvas();
    }

    const scroll = this.scrollOffset();
    console.groupCollapsed('Selecting from Start %s Scroll %s Ev [%d, %d] Canvas %s',
         JSON.stringify(this.startPosition), JSON.stringify(scroll), event.clientX, event.clientY, JSON.stringify(rect));

  }

  moving(event) {

    if (!this.receivedClick) { return; }

    const scroll = this.scrollOffset();
    const rect = this.imgCanvas.getBoundingClientRect();
    // ParseInt calls to ensure we start at a pixel to avoid rectangle in cropped image
    this.stopPosition.x = parseInt(event.clientX.toString()) - parseInt(rect.left.toString());
    this.stopPosition.y = parseInt(event.clientY.toString()) - parseInt(rect.top.toString());
    console.log('dragged to  %s Scroll %s Ev c[%d, %d] p[%d, %d] Canvas %s',
      JSON.stringify(this.stopPosition), JSON.stringify(scroll), event.clientX, event.clientY,event.pageX, event.pageY, JSON.stringify(rect));

    this.resetCanvas();
    this.rectContext.beginPath();
    
     const dir = this.direction();

     console.log('Drag Start%s to Stop %s Ev[%d, %d], Canvas(%d, %d), Crop %s, Scroll %s',
       JSON.stringify(this.startPosition), JSON.stringify(this.stopPosition), dir, 
       event.clientX, event.clientY, rect.left, rect.top,
       JSON.stringify(this.imgSelection),
       JSON.stringify(scroll));
     this.rectContext.strokeStyle = "lime"; 
     this.rectContext.strokeRect( 
     	this.imgSelection.upperLeft.x, this.imgSelection.upperLeft.y,
     	this.imgSelection.deminsions.x, this.imgSelection.deminsions.y);

  }

  direction(): string {
    if ( this.startPosition.x == this.stopPosition.x || 
  	this.startPosition.y == this.stopPosition.y) {
	return 'Line';
	}
    const scroll = this.scrollOffset();
    const descending = this.startPosition.y > this.stopPosition.y;
    const backwards = this.startPosition.x > this.stopPosition.x;
    this.imgSelection.deminsions.x = Math.abs(this.stopPosition.x - this.startPosition.x);
    this.imgSelection.deminsions.y = Math.abs(this.stopPosition.y - this.startPosition.y); 
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
      // Close console output group of selection dragging 
      console.groupEnd();
      const dir = this.direction();
      console.log('Finished selection at %s with direction %s',
        JSON.stringify(this.stopPosition), dir);
      this.changeDetector.detectChanges();
    }
  }

  scrollOffset(): any[] {
    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    return (top || left) ? [Math.floor(left), Math.floor(top)] : [0, 0];

  }

  resetImage() {
    this.resetCanvas();
    this.image = null;
    this.imgDeminsions.y = this.imgDeminsions.x = 0;
    this.imgContext = null;
    this.imgFail = false;
    this.webUrl = ''
  
    if (this.imageToShow) {
      this.imageToShow = null;
    }

  }
  resetCanvas() {
    if (this.rectContext) {
      this.rectContext.clearRect(0, 0, this.rectCanvas.width, this.rectCanvas.height);
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
      this.imgDeminsions.x = this.scaleDeminsions.x = this.image.width;
      this.imgDeminsions.y = this.scaleDeminsions.y = this.image.height;
      this.imgCanvas = document.getElementById('canvasImage') as HTMLCanvasElement;
      this.changeDetector.detectChanges();
      this.imgContext = this.imgCanvas.getContext('2d');
      console.log('canvas is now %d x %d', this.imgDeminsions.x, this.imgDeminsions.y);
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

  largeImage() {
    return this.imgFail && 
           ((this.imageToShow &&  this.imageToShow.length && this.imageToShow.length/(1024*1024) > 2) ||
            (this.imgUrl &&  this.imgUrl.length && this.imgUrl.length/(1024*1024) > 2));
  }
//#endregion

  cropImage() {
    const w = Math.abs(this.stopPosition.x - this.startPosition.x);
    const h = Math.abs(this.stopPosition.y - this.startPosition.y);
    const canvasCrop = document.createElement('canvas');
    // Hard-coded offsets are to remove the rectangle from the cropped image
    canvasCrop.width = w - 2;
    canvasCrop.height = h - 2;

    const imageData = this.imgContext.getImageData(this.imgSelection.upperLeft.x + 1, this.imgSelection.upperLeft.y + 1,
      this.imgSelection.deminsions.x - 1, this.imgSelection.deminsions.y - 1);
    console.log('crop imgSelection %s', JSON.stringify(this.imgSelection));
    const contextCrop = canvasCrop.getContext('2d');
    contextCrop.fillStyle = 'white';
    contextCrop.fill();
    contextCrop.putImageData(imageData, 0, 0);

    this.imageToShow = canvasCrop.toDataURL(this.imgMime);
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
