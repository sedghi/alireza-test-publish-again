import { BaseTool } from './base/index';
// ~~ VTK Viewport
import { getEnabledElement } from './../../index';
import { vec3 } from 'gl-matrix';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

enum DIRECTIONS {
  X = 0,
  Y = 1,
  Z = 2,
}

export default class PetThresholdTool extends BaseTool {
  touchDragCallback: Function;
  mouseDragCallback: Function;
  _configuration: any;

  constructor(toolConfiguration = {}) {
    const defaultToolConfiguration = {
      name: 'VolumeRotate',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        direction: DIRECTIONS.Z,
        rotateIncrementDegrees: 5,
      },
    };

    super(toolConfiguration, defaultToolConfiguration);

    /**
     * Will only fire for cornerstone events:
     * - TOUCH_DRAG
     * - MOUSE_DRAG
     *
     * Given that the tool is active and has matching bindings for the
     * underlying touch/mouse event.
     */
    this.touchDragCallback = this._dragCallback.bind(this);
    this.mouseDragCallback = this._dragCallback.bind(this);
  }

  // Takes ICornerstoneEvent, Mouse or Touch
  _dragCallback(evt) {
    const { element: canvas, deltaPoints } = evt.detail;
    const enabledElement = getEnabledElement(canvas);
    const { viewport } = enabledElement;
    const { direction, rotateIncrementDegrees } = this._configuration;

    const camera = viewport.getCamera();
    const { viewUp, viewPlaneNormal, position, focalPoint } = camera;
    const focalLength = vec3.distance(position, focalPoint);
    const { y: deltaY } = deltaPoints.canvas;

    // Rotate view up and viewPlaneNormal

    let transform = vtkMatrixBuilder.buildFromDegree().identity();

    switch (direction) {
      case DIRECTIONS.X:
        transform.rotateX(deltaY * rotateIncrementDegrees);
        break;
      case DIRECTIONS.Y:
        transform.rotateY(deltaY * rotateIncrementDegrees);
        break;

      case DIRECTIONS.Z:
        transform.rotateZ(deltaY * rotateIncrementDegrees);
        break;
    }

    const transformMatrix = transform.matrix;

    vec3.transformMat4(viewUp, viewUp, transformMatrix);
    vec3.transformMat4(viewPlaneNormal, viewPlaneNormal, transformMatrix);

    // Set position of camera to be distance behind focal point with new direction.

    const newPosition = [
      focalPoint[0] + focalLength * viewPlaneNormal[0],
      focalPoint[1] + focalLength * viewPlaneNormal[1],
      focalPoint[2] + focalLength * viewPlaneNormal[2],
    ];

    viewport.setCamera({
      position: newPosition,
      viewPlaneNormal,
      viewUp,
      focalPoint,
    });

    viewport.render();
  }
}