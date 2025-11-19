/**
 * Elide Mobile Framework - Native UI Components
 *
 * Native mobile UI components for iOS and Android.
 */

import { EventEmitter } from '../desktop/events';
import { NativeBridge } from '../runtime/bridge';

export interface ViewProps {
  id?: string;
  style?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export interface ViewStyle {
  width?: number | string;
  height?: number | string;
  margin?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  flex?: number;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  position?: 'relative' | 'absolute';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;
}

export interface TextStyle extends ViewStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ImageStyle extends ViewStyle {
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export class View extends EventEmitter {
  protected handle: number;
  protected props: ViewProps;
  protected children: View[] = [];

  constructor(props: ViewProps = {}) {
    super();
    this.props = props;
    this.handle = NativeBridge.createView({
      style: props.style,
      testID: props.testID,
    });

    if (props.onPress) {
      this.onPress(props.onPress);
    }
    if (props.onLongPress) {
      this.onLongPress(props.onLongPress);
    }
  }

  onPress(handler: () => void): void {
    NativeBridge.setViewPressHandler(this.handle, handler);
  }

  onLongPress(handler: () => void): void {
    NativeBridge.setViewLongPressHandler(this.handle, handler);
  }

  setStyle(style: ViewStyle): void {
    this.props.style = { ...this.props.style, ...style };
    NativeBridge.setViewStyle(this.handle, this.props.style);
  }

  addChild(child: View): void {
    this.children.push(child);
    NativeBridge.addViewChild(this.handle, child.handle);
  }

  removeChild(child: View): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      NativeBridge.removeViewChild(this.handle, child.handle);
    }
  }

  remove(): void {
    NativeBridge.removeView(this.handle);
  }

  measure(): Promise<{ x: number; y: number; width: number; height: number }> {
    return NativeBridge.measureView(this.handle);
  }

  animate(animation: {
    duration: number;
    properties: Partial<ViewStyle>;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  }): Promise<void> {
    return NativeBridge.animateView(this.handle, animation);
  }
}

export interface TextProps extends ViewProps {
  text: string;
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export class Text extends View {
  constructor(props: TextProps) {
    super(props);
    NativeBridge.setViewType(this.handle, 'text');
    this.setText(props.text);

    if (props.numberOfLines) {
      NativeBridge.setTextNumberOfLines(this.handle, props.numberOfLines);
    }
    if (props.ellipsizeMode) {
      NativeBridge.setTextEllipsizeMode(this.handle, props.ellipsizeMode);
    }
  }

  setText(text: string): void {
    NativeBridge.setTextContent(this.handle, text);
  }

  getText(): string {
    return NativeBridge.getTextContent(this.handle);
  }
}

export interface ImageProps extends ViewProps {
  source: string | { uri: string };
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export class Image extends View {
  constructor(props: ImageProps) {
    super(props);
    NativeBridge.setViewType(this.handle, 'image');

    const source = typeof props.source === 'string' ? props.source : props.source.uri;
    this.setSource(source);

    if (props.resizeMode) {
      NativeBridge.setImageResizeMode(this.handle, props.resizeMode);
    }

    if (props.onLoad) {
      NativeBridge.onImageLoad(this.handle, props.onLoad);
    }

    if (props.onError) {
      NativeBridge.onImageError(this.handle, props.onError);
    }
  }

  setSource(source: string): void {
    NativeBridge.setImageSource(this.handle, source);
  }
}

export interface ButtonProps extends ViewProps {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

export class Button extends View {
  constructor(props: ButtonProps) {
    super(props);
    NativeBridge.setViewType(this.handle, 'button');
    this.setTitle(props.title);

    if (props.color) {
      NativeBridge.setButtonColor(this.handle, props.color);
    }

    if (props.disabled !== undefined) {
      this.setDisabled(props.disabled);
    }

    this.onPress(props.onPress);
  }

  setTitle(title: string): void {
    NativeBridge.setButtonTitle(this.handle, title);
  }

  setDisabled(disabled: boolean): void {
    NativeBridge.setButtonDisabled(this.handle, disabled);
  }
}

export interface TextInputProps extends ViewProps {
  value?: string;
  placeholder?: string;
  placeholderColor?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email' | 'numeric' | 'phone' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
  multiline?: boolean;
  onChange?: (text: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export class TextInput extends View {
  constructor(props: TextInputProps) {
    super(props);
    NativeBridge.setViewType(this.handle, 'text-input');

    if (props.value) {
      this.setValue(props.value);
    }

    if (props.placeholder) {
      NativeBridge.setTextInputPlaceholder(this.handle, props.placeholder);
    }

    if (props.placeholderColor) {
      NativeBridge.setTextInputPlaceholderColor(this.handle, props.placeholderColor);
    }

    if (props.secureTextEntry) {
      NativeBridge.setTextInputSecure(this.handle, true);
    }

    if (props.keyboardType) {
      NativeBridge.setTextInputKeyboardType(this.handle, props.keyboardType);
    }

    if (props.autoCapitalize) {
      NativeBridge.setTextInputAutoCapitalize(this.handle, props.autoCapitalize);
    }

    if (props.autoCorrect !== undefined) {
      NativeBridge.setTextInputAutoCorrect(this.handle, props.autoCorrect);
    }

    if (props.maxLength) {
      NativeBridge.setTextInputMaxLength(this.handle, props.maxLength);
    }

    if (props.multiline) {
      NativeBridge.setTextInputMultiline(this.handle, true);
    }

    if (props.onChange) {
      NativeBridge.onTextInputChange(this.handle, props.onChange);
    }

    if (props.onSubmit) {
      NativeBridge.onTextInputSubmit(this.handle, props.onSubmit);
    }

    if (props.onFocus) {
      NativeBridge.onTextInputFocus(this.handle, props.onFocus);
    }

    if (props.onBlur) {
      NativeBridge.onTextInputBlur(this.handle, props.onBlur);
    }
  }

  setValue(value: string): void {
    NativeBridge.setTextInputValue(this.handle, value);
  }

  getValue(): string {
    return NativeBridge.getTextInputValue(this.handle);
  }

  focus(): void {
    NativeBridge.focusTextInput(this.handle);
  }

  blur(): void {
    NativeBridge.blurTextInput(this.handle);
  }

  clear(): void {
    this.setValue('');
  }
}

export interface ScrollViewProps extends ViewProps {
  horizontal?: boolean;
  showScrollIndicator?: boolean;
  onScroll?: (event: { x: number; y: number }) => void;
}

export class ScrollView extends View {
  constructor(props: ScrollViewProps) {
    super(props);
    NativeBridge.setViewType(this.handle, 'scroll-view');

    if (props.horizontal) {
      NativeBridge.setScrollViewHorizontal(this.handle, true);
    }

    if (props.showScrollIndicator !== undefined) {
      NativeBridge.setScrollViewShowIndicator(this.handle, props.showScrollIndicator);
    }

    if (props.onScroll) {
      NativeBridge.onScrollViewScroll(this.handle, props.onScroll);
    }
  }

  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void {
    NativeBridge.scrollViewScrollTo(this.handle, options);
  }

  scrollToEnd(animated: boolean = true): void {
    NativeBridge.scrollViewScrollToEnd(this.handle, animated);
  }
}

export interface ListViewProps<T> extends ViewProps {
  data: T[];
  renderItem: (item: T, index: number) => View;
  keyExtractor?: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

export class ListView<T> extends View {
  private data: T[];
  private renderItem: (item: T, index: number) => View;

  constructor(props: ListViewProps<T>) {
    super(props);
    NativeBridge.setViewType(this.handle, 'list-view');

    this.data = props.data;
    this.renderItem = props.renderItem;

    if (props.onEndReached) {
      NativeBridge.onListViewEndReached(this.handle, props.onEndReached);
    }

    if (props.onEndReachedThreshold) {
      NativeBridge.setListViewEndReachedThreshold(this.handle, props.onEndReachedThreshold);
    }

    this.renderList();
  }

  private renderList(): void {
    NativeBridge.clearListView(this.handle);

    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      const view = this.renderItem(item, i);
      NativeBridge.addListViewItem(this.handle, view.handle);
    }
  }

  setData(data: T[]): void {
    this.data = data;
    this.renderList();
  }

  refresh(): void {
    this.renderList();
  }
}
