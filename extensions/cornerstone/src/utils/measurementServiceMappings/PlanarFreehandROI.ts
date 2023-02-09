import { MeasurementService } from '@ohif/core';
import { extensionUtils as csExtensionUtils } from '@ohif/extension-cornerstone';

/**
 * Measurement Mapping Service object for FreehandROI tool.
 * See {@link CustomTools.FreehandROITool} to see imaging annotation tool format.
 *
 * @typedef {Object}
 * @property {ToAnnotationMethod} toAnnotation
 * @property {ToMeasurementMethod} toMeasurement
 * @property {GetMatchingCriteriaArray} getMatchingCriteriaArray
 */
const FreehandROI = {
  toAnnotation: measurement => {
    const annotationUID = measurement.uid;
    const cornerstone3DAnnotation = cs3DToolsAnnotation.state.getAnnotation(
      annotationUID
    );

    if (!cornerstone3DAnnotation) {
      return;
    }

    // side effect, cs should provide api to prevent changing by ref.
    cornerstone3DAnnotation.data.label = measurement.label;
    cornerstone3DAnnotation.data.findingSite = measurement.findingSite;
    cornerstone3DAnnotation.data.finding = measurement.finding;
    cornerstone3DAnnotation.data.polyline = measurement.data.polyline;
    cornerstone3DAnnotation.data.isOpenContour = measurement.data.isOpenContour;
    cornerstone3DAnnotation.data.isOpenUShapeContour =
      measurement.data.isOpenUShapeContour;
    cornerstone3DAnnotation.data.handles = measurement.data.handles;

    const lineDash =
      cornerstone3DAnnotation.data.findingSite ||
        cornerstone3DAnnotation.data.finding
        ? '[]'
        : '';

    csExtensionUtils.annotation.setAnnotationLineDash(
      cornerstone3DAnnotation.annotationUID,
      lineDash
    );
    csExtensionUtils.annotation.setAnnotationColor(
      cornerstone3DAnnotation.annotationUID,
      measurement.color
    );
    csExtensionUtils.annotation.setAnnotationVisibility(
      cornerstone3DAnnotation.annotationUID,
      measurement.visible
    );
    csExtensionUtils.annotation.setAnnotationSelected(
      cornerstone3DAnnotation.annotationUID,
      measurement.active
    );
  },

  toMeasurement: (
    csToolsEventDetail,
    DisplaySetService,
    Cornerstone3DViewportService,
    getValueTypeFromToolType
  ) => {
    const { annotation: cs3DAnnotation, viewportId } = csToolsEventDetail;
    const { metadata, data, annotationUID, isVisible } = cs3DAnnotation;

    console.log('toMeasurement PlanarFreehandROI');
    if (!metadata || !data) {
      console.warn('FreehandROI tool: Missing metadata or data');
      return null;
    }

    const active = csExtensionUtils.annotation.isAnnotationSelected(
      annotationUID
    );
    const color = csExtensionUtils.annotation.getAnnotationColor(annotationUID);

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;

    const {
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = csExtensionUtils.getSOPInstanceAttributes(
      referencedImageId,
      Cornerstone3DViewportService,
      viewportId
    );

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(
      cs3DAnnotation,
      DisplaySetService
    );

    const displayText = getDisplayText(mappedAnnotations);
    const getReport = () =>
      _getReport(mappedAnnotations, points, FrameOfReferenceUID);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label || metadata.label, // TODO -> Resolve issues on the base layer. There is a discrepency between CS3D and dcmjs.
      displayText: displayText,
      data: data,
      type: getValueTypeFromToolType(toolName),
      getReport,
      visible: isVisible,
      findingSite: data.findingSite,
      finding: data.finding,
      active,
      color,
    };
  },

  getMatchingCriteriaArray: (measurementService: MeasurementService) => {
    return [
      {
        valueType: MeasurementService.VALUE_TYPES.POLYLINE,
        // OHIF does not yet support multi points for matching criteria
        points: 1,
      },
    ];
  },
};

/**
 * It maps an imaging library annotation to a list of simplified annotation properties.
 *
 * @param {Object} annotationData
 * @param {Object} DisplaySetService
 * @returns
 */
function getMappedAnnotations(annotationData, DisplaySetService) {
  const { metadata, data } = annotationData;
  const { label } = data;
  const { referencedImageId } = metadata;

  const annotations = [];

  const {
    SOPInstanceUID: _SOPInstanceUID,
    SeriesInstanceUID: _SeriesInstanceUID,
  } = csExtensionUtils.getSOPInstanceAttributes(referencedImageId) || {};

  if (!_SOPInstanceUID || !_SeriesInstanceUID) {
    return annotations;
  }

  const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
    _SOPInstanceUID,
    _SeriesInstanceUID
  );

  const { SeriesNumber, SeriesInstanceUID } = displaySet;

  annotations.push({
    SeriesInstanceUID,
    SeriesNumber,
    label,
  });

  return annotations;
}

/**
 * TBD
 * This function is used to convert the measurement data to a format that is suitable for the report generation (e.g. for the csv report).
 * The report returns a list of columns and corresponding values.
 * @param {*} mappedAnnotations
 * @param {*} points
 * @param {*} FrameOfReferenceUID
 * @returns Object representing the report's content for this tool.
 */
function _getReport(mappedAnnotations, points, FrameOfReferenceUID) {
  const columns = [];
  const values = [];

  return {
    columns,
    values,
  };
}

function getDisplayText(mappedAnnotations) {
  return '';
}

export default FreehandROI;
