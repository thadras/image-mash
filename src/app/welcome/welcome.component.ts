import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadImageService } from './../load-image.service';

//#region interfaces
interface Position {
  top: number;
  left: number;

}

interface Rectangle {
  orgin: Position;
  deminsions: Position;
}

interface FileReaderEventTarget extends EventTarget {
  result: string;
}

interface FileReaderEvent extends Event {
  target: FileReaderEventTarget;
  getMessage():string;
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
  webUrl: string;
  imgFile: any;
  imgMime: string = '';
  imgFail: boolean =false;
  receivedClick: boolean = false;
  imgDeminsions: Position = { top: 0, left: 0 };
  scaleDeminsions: Position = { top: 0, left: 0 };

  startPosition: Position = { top: 0, left: 0 };
  stopPosition: Position = { top: 0, left: 0 };
  imgSelection: Rectangle = {
    orgin: { top: 0, left: 0 },
    deminsions: { top: 0, left: 0 }
  }
  
  imgCanvas: HTMLCanvasElement;
  imgContext: CanvasRenderingContext2D | null;
  rectCanvas: HTMLCanvasElement;
  rectContext: CanvasRenderingContext2D | null;
  scaleValue: number = 1;
  scaled: boolean = false;
  image: any;
  imageToShow: any;
  isImageLoading: boolean;
  // #endregion

  constructor(private changeDetector: ChangeDetectorRef, 
    private imageService: LoadImageService) {  }

  ngOnInit() {
  }

  //#region Image selection and reseting
 
  beginDrag(event) {

    this.receivedClick = true;
    const rect = this.imgCanvas.getBoundingClientRect();

    this.startPosition.left = this.stopPosition.left = event.clientX - rect.left;
    this.startPosition.top = this.stopPosition.top = event.clientY - rect.top;

    if (!this.rectCanvas) {
      this.rectCanvas = document.getElementById('canvasImage') as HTMLCanvasElement;
      this.rectContext = this.rectCanvas.getContext("2d");
    }
    this.resetCanvas();

    console.groupCollapsed('started dragging from %d x %d', 
         this.startPosition.left, this.startPosition.top);
    const scroll: any[] = this.scrollOffset();
    console.groupEnd();

  }

  moving(event) {
    
    if (!this.receivedClick) { return }

    const rect = this.imgCanvas.getBoundingClientRect();
    this.stopPosition.top = event.pageY - rect.top;
    this.stopPosition.left = event.pageX - rect.left;
    this.resetCanvas();
    this.rectContext.beginPath();
    
    const x = (this.startPosition.left > this.stopPosition.left) ? this.stopPosition.left : this.startPosition.left;
    const y = (this.startPosition.top > this.stopPosition.top) ?  this.stopPosition.top : this.startPosition.top ; 
    const w = (this.stopPosition.left > this.startPosition.left) ? this.stopPosition.left - this.startPosition.left
      : this.startPosition.left - this.stopPosition.left; 
    const h = (this.stopPosition.top > this.startPosition.top) ? this.stopPosition.top - this.startPosition.top
      : this.startPosition.top - this.stopPosition.top; 
    const scroll = this.scrollOffset();
    //console.log('drag-rect from O(%d, %d) to C(%d, %d) rect (%d, %d, %d, %d)', this.startPosition.left,
    //  this.startPosition.top, this.stopPosition.left, this.stopPosition.top, x, y, w, h);
      
    this.imgSelection.orgin.left = x;
    this.imgSelection.orgin.top =  y;
    this.imgSelection.deminsions.left = (!scroll.length) ? w : w - scroll[0];
    this.imgSelection.deminsions.top = (!scroll.length) ? h : h - scroll[1];
    this.rectContext.strokeRect(x, y, this.imgSelection.deminsions.left, this.imgSelection.deminsions.top);

  }
  
  endDrag(event) {
    if (this.receivedClick) {
      this.receivedClick = false;
      console.groupCollapsed('finished dragging at %d x %d',
        this.stopPosition.left, this.stopPosition.top);
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
    this.resetCanvas()
    this.image = null;
    this.imgDeminsions.top = this.imgDeminsions.left = 0;
    this.imgContext = null;
    this.imgFail = false;
  }

  resetCanvas() {
    if (this.rectContext) {
      this.rectContext.clearRect(0, 0, this.rectCanvas.width, this.rectCanvas.height);
    }
    if (this.imageToShow) {
      this.imageToShow = null;
    }

    this.imgSelection.deminsions.left = this.imgSelection.deminsions.top = 0;
    this.scaleValue = 1;

    if (this.imgContext) {
      this.imgContext.drawImage(this.image, 0, 0);
    }

    this.changeDetector.detectChanges();
  }
  //#endregion

  //#region Image generation
  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    const type = image.type.split('/');
    if ('image' !== type[0]) {
      this.imgFail = true;
      return;
    }
    console.log('createImageFromBlob type is %s', image.type);
    this.imgMime = image.type;
    reader.addEventListener("load", this.doFileRead.bind(this, reader), false);
 
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

        console.log('selected %d files', imageFile.target.files.length)
        let reader = new FileReader();
        reader.addEventListener('load', this.doFileRead.bind(this, reader), false);
        console.log(imageFile.target.files[0]);
        reader.readAsDataURL(imageFile.target.files[0]);
        this.imgMime = imageFile.target.files[0].type;

        console.groupEnd();
      
    } else {
        alert("Your browser is too old to support HTML5 File API");
    }
  }

  doFileRead(reader){
    this.resetImage();
    this.image = new Image();
    this.image.src = reader.result as string;
    this.image.addEventListener('load', () => {

      console.groupCollapsed('loaded the image type %s  with w: %d by h: %d',this.imgMime, this.image.width, this.image.height);
      this.isImageLoading = true;
      this.imgDeminsions.top = this.scaleDeminsions.top = this.image.height;
      this.imgDeminsions.left = this.scaleDeminsions.left = this.image.width;
      this.imgCanvas = document.getElementById('canvasImage') as HTMLCanvasElement;
      this.changeDetector.detectChanges();
      this.imgContext = this.imgCanvas.getContext("2d");
      console.log('canvas is now %d x %d', this.imgDeminsions.top, this.imgDeminsions.left);
      this.imgContext.drawImage(this.image, 0, 0);
      console.groupEnd();
    });
    this.imgUrl = reader.result as string;
    console.log('read the file its length is %s', this.imgUrl.length);
  }

  getImageFromService() {
      if(!this.webUrl) {
        console.error('No image has been selected!');
        console.log(this.webUrl);
        return;
      }

        if (this.imgContext) {
          this.resetCanvas();
        }

      this.image = new Image();
      this.image.crossOrigin = "anonymous";
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
    canvasCrop.width = this.imgSelection.deminsions.left-3;
    canvasCrop.height = this.imgSelection.deminsions.top-2;

    const imageData = this.imgContext.getImageData(this.imgSelection.orgin.left+2, this.imgSelection.orgin.top+1,
      this.imgSelection.deminsions.left-2, this.imgSelection.deminsions.top-2);
    console.log('crop from %s %s to size %s %s', this.imgSelection.orgin.left+2, this.imgSelection.orgin.top+1,
        this.imgSelection.deminsions.left-2, this.imgSelection.deminsions.top-2);
    const contextCrop = canvasCrop.getContext('2d');
    contextCrop.fillStyle = 'white';
    contextCrop.fill();
    contextCrop.putImageData(imageData, 0, 0);

    this.imageToShow = canvasCrop.toDataURL(this.imgMime);
  }

  scaleImage(scale){
    var canvasScale = document.getElementById("scaledCanvas") as HTMLCanvasElement; 
    var contextScale = canvasScale.getContext("2d");
    if(scale) {
      this.scaleValue /= 0.8;
      this.scaleDeminsions.left = canvasScale.width = Math.ceil(this.imgDeminsions.left * this.scaleValue);
      this.scaleDeminsions.top  = canvasScale.height = Math.ceil(this.imgDeminsions.top * this.scaleValue);
    } else {
      this.scaleValue *= 0.8;
      this.scaleDeminsions.left = canvasScale.width = Math.ceil(this.imgDeminsions.left * this.scaleValue);
      this.scaleDeminsions.top  = canvasScale.height = Math.ceil(this.imgDeminsions.top * this.scaleValue);
    }

    // clear canvas
    contextScale.scale(this.scaleValue, this.scaleValue);
    contextScale.drawImage(this.image, 0, 0);
    this.imageToShow = canvasScale.toDataURL(this.imgMime);
    this.changeDetector.detectChanges();

  }

  saveImage(source) {
    console.log('saving image from %s', source);
    const element = document.createElement('a');
    element.setAttribute('href', (source === 'edit') ? this.imageToShow : this.image.src);
    
    let ext: string = '';
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
          ext ='png';
          break;
    }
    element.type = this.imgMime;
    element.setAttribute('download', (source === 'file') ? 'loadedImage.' + ext: 'editedImage.'+ext);
    document.body.appendChild(element);
    if (element.href.length > 2**11) {
      this.imgFail = true;
    }	
    console.log('set file name %s, URI length %d', element.download, element.href.length);
    element.click();
    document.body.removeChild(element);
  }
}
