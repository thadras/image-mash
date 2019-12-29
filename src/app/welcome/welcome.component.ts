import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadImageService } from './../load-image.service';

interface Position {
  top: number;
  left: number;

}

interface Rectangle {
  orgin: Position;
  deminsions: Position;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  // #region Members
  imgUrl: string;
  imgFile: any;
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

  //#region Image selection
 
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

    console.log('started dragging from %d x %d', 
         this.startPosition.left, this.startPosition.top);
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
    
    console.log('drag-rect from O(%d, %d) to C(%d, %d) rect (%d, %d, %d, %d)', this.startPosition.left,
      this.startPosition.top, this.stopPosition.left, this.stopPosition.top, x, y, w, h);

    this.imgSelection.orgin.left = x;
    this.imgSelection.orgin.top = y;
    this.imgSelection.deminsions.left = w;
    this.imgSelection.deminsions.top = h;
    this.rectContext.strokeRect(x, y, w, h);

  }
  
  endDrag(event) {
    this.receivedClick = false;
    console.log('finished dragging at %d x %d',
      this.stopPosition.left, this.stopPosition.top);
    console.log(this.imgSelection);
    this.changeDetector.detectChanges();
  }

  mouseEnter(event) {
    console.log(event)
    if (this.receivedClick) {
      this.moving(event);
    }
  }

  resetCanvas() {
    if (this.rectContext) {
      this.rectContext.clearRect(0, 0, this.rectCanvas.width, this.rectCanvas.height);
    }
    if (this.imageToShow) {
      this.imageToShow = null;
      this.imgSelection.deminsions.left = this.imgSelection.deminsions.top = 0;
    }
    this.scaleValue = 1;
    this.imgContext.drawImage(this.image, 0, 0);
    this.changeDetector.detectChanges();
  }
  //#endregion

  //#region Image generation
  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
       this.imageToShow = reader.result;
    }, false);
 
    if (image) {
       reader.readAsDataURL(image);
    }
  }

  readImageFromUser(imageFile) {
    console.groupCollapsed('User has selected a file!');
    console.log(imageFile);
    console.log(this.imgFile);
    if (this.imgContext) {
      this.resetCanvas();
    }
    // Check for the various File API support.
    if (window['File'] && window['FileReader'] && window['FileList'] && window['Blob']) {

        console.log('selected %d files', imageFile.target.files.length)
        let reader = new FileReader();
        reader.addEventListener('load', () => {
          this.image = new Image();
          this.image.src = reader.result as string;
          this.image.addEventListener('load', () => {
            console.groupCollapsed('loaded the image from the file: %d by %d', this.image.width, this.image.height);
            console.log(this.image);
            this.isImageLoading = true;
            this.imgDeminsions.top = this.scaleDeminsions.top = this.image.height;
            this.imgDeminsions.left = this.scaleDeminsions.left = this.image.width;
            this.imgCanvas = document.getElementById('canvasImage') as HTMLCanvasElement;
            this.changeDetector.detectChanges();
            this.imgContext = this.imgCanvas.getContext("2d");
            console.log(this.imgCanvas);
            console.log('canvas is now %d x %d', this.imgDeminsions.top, this.imgDeminsions.left);
            this.imgContext.drawImage(this.image, 0, 0);
            console.groupEnd();
          });
          this.imgUrl = reader.result as string;
          console.log('read the file its length is %s', this.imgUrl.length);
        }, false);
        console.log(imageFile.target.files[0]);
        reader.readAsDataURL(imageFile.target.files[0]);
        console.groupEnd();
      
    } else {
        alert("Your browser is too old to support HTML5 File API");
    }
  }
  // http://kryogenix.org/images/hackergotchi-simpler.png
  /*
  getImageFromService() {
      if(!this.imgUrl) {
        console.error('No image has been selected!');
        console.log(this.imgUrl);
        return;
      }


      this.isImageLoading = true;
      console.log('going to get: %s', this.imgUrl)
      this.imageService.getImage(this.imgUrl).subscribe(data => {
        this.createImageFromBlob(data);
        this.isImageLoading = false;
      }, error => {
        this.isImageLoading = false;
        console.error(error);
      });
  }
  */
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

    this.imageToShow = canvasCrop.toDataURL("image/png");
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
    this.imageToShow = canvasScale.toDataURL("image/png");
    this.changeDetector.detectChanges();

  }

  saveImage(source) {
    console.log('saving image from source %s', source);
    const element = document.createElement('a');
    element.setAttribute('href', this.imageToShow);
    element.setAttribute('download', 'croppedImage.png');
    document.body.appendChild(element);

    element.click();
  
    console.log(element);
    document.body.removeChild(element);
  }
}
