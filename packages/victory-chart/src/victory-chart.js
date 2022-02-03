import { defaults, assign, isEmpty } from "lodash";
import PropTypes from "prop-types";
import React, { useMemo } from "react";
import {
  Background,
  Helpers,
  VictoryContainer,
  VictoryTheme,
  CommonProps,
  PropTypes as CustomPropTypes,
  Wrapper,
  Hooks
} from "victory-core";
import { VictorySharedEvents } from "victory-shared-events";
import { VictoryAxis } from "victory-axis";
import { VictoryPolarAxis } from "victory-polar-axis";
import {
  getBackgroundWithProps,
  getChildComponents,
  getCalculatedProps,
  getChildren
} from "./helper-methods";
import isEqual from "react-fast-compare";

const fallbackProps = {
  width: 450,
  height: 300,
  padding: 50
};

const VictoryChart = (initialProps) => {
  const role = "chart";
  const { getAnimationProps, setAnimationState, getProps } =
    Hooks.useAnimationState();
  const props = getProps(initialProps);

  const userEnteredProps = useMemo(() => {
    const additionalKeys = [
      "backgroundComponent",
      "children",
      "containerComponent",
      "defaultAxes",
      "defaultPolarAxes",
      "groupComponent",
      "title"
    ];
    return Helpers.getUserEnteredProps(initialProps, additionalKeys);
  }, [initialProps]);

  const modifiedProps = Helpers.modifyProps(props, fallbackProps, role);

  const {
    eventKey,
    containerComponent,
    standalone,
    groupComponent,
    externalEventMutations,
    width,
    height,
    theme,
    polar,
    name,
    title,
    desc
  } = modifiedProps;

  const axes = props.polar
    ? modifiedProps.defaultPolarAxes
    : modifiedProps.defaultAxes;

  const childComponents = useMemo(
    () => getChildComponents(modifiedProps, axes),
    [modifiedProps, axes]
  );

  const calculatedProps = useMemo(
    () => getCalculatedProps(modifiedProps, childComponents),
    [modifiedProps, childComponents]
  );
  const { domain, scale, style, origin, radius, horizontal } = calculatedProps;

  const newChildren = useMemo(() => {
    const children = getChildren(props, childComponents, calculatedProps);

    const mappedChildren = children.map((child, index) => {
      const childProps = assign(
        { animate: getAnimationProps(props, child, index, "victory chart") },
        child.props
      );
      return React.cloneElement(child, childProps);
    });

    if (props.style && props.style.background) {
      const backgroundComponent = getBackgroundWithProps(
        props,
        calculatedProps
      );

      mappedChildren.unshift(backgroundComponent);
    }

    return mappedChildren;
  }, [getAnimationProps, childComponents, props, calculatedProps]);

  const containerProps = useMemo(() => {
    if (standalone) {
      return {
        desc,
        domain,
        height,
        horizontal,
        name,
        origin: polar ? origin : undefined,
        polar,
        radius,
        scale,
        standalone,
        style: style.parent,
        theme,
        title,
        userEnteredProps,
        width
      };
    }
    return {};
  }, [
    desc,
    domain,
    height,
    horizontal,
    name,
    origin,
    polar,
    radius,
    scale,
    standalone,
    style,
    theme,
    title,
    userEnteredProps,
    width
  ]);

  const container = useMemo(() => {
    if (standalone) {
      const defaultContainerProps = defaults(
        {},
        containerComponent.props,
        containerProps
      );
      return React.cloneElement(containerComponent, defaultContainerProps);
    }
    return groupComponent;
  }, [groupComponent, standalone, containerComponent, containerProps]);

  const events = useMemo(() => {
    return Wrapper.getAllEvents(props);
  }, [props]);

  const previousProps = Hooks.usePreviousProps(initialProps);

  React.useEffect(() => {
    // This is called before dismount to keep state in sync
    return () => {
      if (initialProps.animate) {
        setAnimationState(previousProps, initialProps);
      }
    };
  }, [setAnimationState, previousProps, initialProps]);

  if (!isEmpty(events)) {
    return (
      <VictorySharedEvents
        container={container}
        eventKey={eventKey}
        events={events}
        externalEventMutations={externalEventMutations}
      >
        {newChildren}
      </VictorySharedEvents>
    );
  }
  return React.cloneElement(container, container.props, newChildren);
};

VictoryChart.propTypes = {
  ...CommonProps.baseProps,
  backgroundComponent: PropTypes.element,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  defaultAxes: PropTypes.shape({
    independent: PropTypes.element,
    dependent: PropTypes.element
  }),
  defaultPolarAxes: PropTypes.shape({
    independent: PropTypes.element,
    dependent: PropTypes.element
  }),
  endAngle: PropTypes.number,
  innerRadius: CustomPropTypes.nonNegative,
  prependDefaultAxes: PropTypes.bool,
  startAngle: PropTypes.number
};

VictoryChart.defaultProps = {
  backgroundComponent: <Background />,
  containerComponent: <VictoryContainer />,
  defaultAxes: {
    independent: <VictoryAxis />,
    dependent: <VictoryAxis dependentAxis />
  },
  defaultPolarAxes: {
    independent: <VictoryPolarAxis />,
    dependent: <VictoryPolarAxis dependentAxis />
  },
  groupComponent: <g />,
  standalone: true,
  theme: VictoryTheme.grayscale
};

const VictoryChartMemo = React.memo(VictoryChart, isEqual);

VictoryChartMemo.displayName = "VictoryChart";
VictoryChartMemo.expectedComponents = ["groupComponent", "containerComponent"];

export default VictoryChartMemo;
