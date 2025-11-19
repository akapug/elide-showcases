/**
 * PyTorch Neural Network Models in TypeScript
 *
 * Demonstrates importing PyTorch and building deep learning models
 * directly in TypeScript using Elide's polyglot capabilities.
 */

// @ts-ignore
import torch from 'python:torch';
// @ts-ignore
import torch_nn from 'python:torch.nn';
// @ts-ignore
import torch_functional from 'python:torch.nn.functional';
// @ts-ignore
import torch_optim from 'python:torch.optim';
// @ts-ignore
import numpy from 'python:numpy';

/**
 * Base Neural Network class with common functionality
 */
export abstract class BaseNeuralNetwork {
  protected model: any;
  protected device: any;
  protected optimizer: any;
  protected criterion: any;
  protected history: Record<string, number[]>;

  constructor() {
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
    this.history = {
      train_loss: [],
      val_loss: [],
      train_acc: [],
      val_acc: []
    };
    console.log(`Using device: ${this.device}`);
  }

  /**
   * Move model to device
   */
  protected toDevice(): void {
    if (this.model) {
      this.model.to(this.device);
    }
  }

  /**
   * Get number of parameters
   */
  getParameterCount(): number {
    let total = 0;
    for (const param of this.model.parameters()) {
      total += param.numel();
    }
    return total;
  }

  /**
   * Print model summary
   */
  summary(): void {
    console.log(this.model);
    console.log(`Total parameters: ${this.getParameterCount().toLocaleString()}`);
  }

  /**
   * Save model weights
   */
  saveWeights(path: string): void {
    torch.save(this.model.state_dict(), path);
    console.log(`Model weights saved to ${path}`);
  }

  /**
   * Load model weights
   */
  loadWeights(path: string): void {
    const state_dict = torch.load(path);
    this.model.load_state_dict(state_dict);
    console.log(`Model weights loaded from ${path}`);
  }
}

/**
 * Multi-Layer Perceptron (MLP) for classification
 */
export class MLP extends BaseNeuralNetwork {
  constructor(
    input_size: number,
    hidden_sizes: number[],
    num_classes: number,
    dropout: number = 0.5
  ) {
    super();

    const layers: any[] = [];
    let prev_size = input_size;

    // Build hidden layers
    for (const hidden_size of hidden_sizes) {
      layers.push(torch_nn.Linear(prev_size, hidden_size));
      layers.push(torch_nn.ReLU());
      layers.push(torch_nn.BatchNorm1d(hidden_size));
      layers.push(torch_nn.Dropout(dropout));
      prev_size = hidden_size;
    }

    // Output layer
    layers.push(torch_nn.Linear(prev_size, num_classes));

    this.model = torch_nn.Sequential(...layers);
    this.toDevice();
  }

  forward(x: any): any {
    return this.model(x);
  }

  /**
   * Train the model
   */
  async train(
    X_train: any,
    y_train: any,
    X_val: any,
    y_val: any,
    epochs: number = 100,
    batch_size: number = 32,
    learning_rate: number = 0.001
  ): Promise<Record<string, number[]>> {
    // Convert to tensors
    const X_train_tensor = torch.FloatTensor(X_train).to(this.device);
    const y_train_tensor = torch.LongTensor(y_train).to(this.device);
    const X_val_tensor = torch.FloatTensor(X_val).to(this.device);
    const y_val_tensor = torch.LongTensor(y_val).to(this.device);

    // Setup optimizer and loss
    this.optimizer = torch_optim.Adam(this.model.parameters(), { lr: learning_rate });
    this.criterion = torch_nn.CrossEntropyLoss();

    // Learning rate scheduler
    const scheduler = torch_optim.lr_scheduler.ReduceLROnPlateau(
      this.optimizer,
      { mode: 'min', factor: 0.5, patience: 5, verbose: true }
    );

    const n_batches = Math.ceil(X_train_tensor.shape[0] / batch_size);

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Training phase
      this.model.train();
      let epoch_loss = 0;
      let correct = 0;

      for (let i = 0; i < n_batches; i++) {
        const start = i * batch_size;
        const end = Math.min(start + batch_size, X_train_tensor.shape[0]);

        const batch_X = X_train_tensor.slice([start, end]);
        const batch_y = y_train_tensor.slice([start, end]);

        this.optimizer.zero_grad();
        const outputs = this.forward(batch_X);
        const loss = this.criterion(outputs, batch_y);

        loss.backward();
        this.optimizer.step();

        epoch_loss += loss.item();

        const predicted = torch.argmax(outputs, { dim: 1 });
        correct += predicted.eq(batch_y).sum().item();
      }

      const train_loss = epoch_loss / n_batches;
      const train_acc = correct / X_train_tensor.shape[0];

      // Validation phase
      const [val_loss, val_acc] = this.evaluate(X_val_tensor, y_val_tensor);

      this.history.train_loss.push(train_loss);
      this.history.val_loss.push(val_loss);
      this.history.train_acc.push(train_acc);
      this.history.val_acc.push(val_acc);

      console.log(
        `Epoch ${epoch + 1}/${epochs} - ` +
        `train_loss: ${train_loss.toFixed(4)} - train_acc: ${train_acc.toFixed(4)} - ` +
        `val_loss: ${val_loss.toFixed(4)} - val_acc: ${val_acc.toFixed(4)}`
      );

      scheduler.step(val_loss);
    }

    return this.history;
  }

  /**
   * Evaluate the model
   */
  evaluate(X: any, y: any): [number, number] {
    this.model.eval();
    let total_loss = 0;
    let correct = 0;

    torch.no_grad(() => {
      const outputs = this.forward(X);
      total_loss = this.criterion(outputs, y).item();

      const predicted = torch.argmax(outputs, { dim: 1 });
      correct = predicted.eq(y).sum().item();
    });

    const accuracy = correct / y.shape[0];
    return [total_loss, accuracy];
  }

  /**
   * Make predictions
   */
  predict(X: any): any {
    this.model.eval();
    const X_tensor = torch.FloatTensor(X).to(this.device);

    let predictions: any;
    torch.no_grad(() => {
      const outputs = this.forward(X_tensor);
      predictions = torch.argmax(outputs, { dim: 1 }).cpu().numpy();
    });

    return predictions;
  }

  /**
   * Get prediction probabilities
   */
  predictProba(X: any): any {
    this.model.eval();
    const X_tensor = torch.FloatTensor(X).to(this.device);

    let probabilities: any;
    torch.no_grad(() => {
      const outputs = this.forward(X_tensor);
      probabilities = torch_functional.softmax(outputs, { dim: 1 }).cpu().numpy();
    });

    return probabilities;
  }
}

/**
 * Convolutional Neural Network for image classification
 */
export class ConvNet extends BaseNeuralNetwork {
  private conv1: any;
  private conv2: any;
  private conv3: any;
  private pool: any;
  private fc1: any;
  private fc2: any;
  private fc3: any;
  private dropout: any;

  constructor(num_classes: number = 10, input_channels: number = 3) {
    super();

    // Convolutional layers
    this.conv1 = torch_nn.Conv2d(input_channels, 32, 3, { padding: 1 });
    this.conv2 = torch_nn.Conv2d(32, 64, 3, { padding: 1 });
    this.conv3 = torch_nn.Conv2d(64, 128, 3, { padding: 1 });

    this.pool = torch_nn.MaxPool2d(2, 2);
    this.dropout = torch_nn.Dropout(0.5);

    // Fully connected layers (size depends on input image size)
    this.fc1 = torch_nn.Linear(128 * 4 * 4, 512);
    this.fc2 = torch_nn.Linear(512, 256);
    this.fc3 = torch_nn.Linear(256, num_classes);

    this.buildModel();
    this.toDevice();
  }

  private buildModel(): void {
    // Create sequential model for easier management
    this.model = {
      forward: (x: any) => this.forward(x),
      parameters: () => [
        ...this.conv1.parameters(),
        ...this.conv2.parameters(),
        ...this.conv3.parameters(),
        ...this.fc1.parameters(),
        ...this.fc2.parameters(),
        ...this.fc3.parameters()
      ],
      to: (device: any) => {
        this.conv1.to(device);
        this.conv2.to(device);
        this.conv3.to(device);
        this.fc1.to(device);
        this.fc2.to(device);
        this.fc3.to(device);
        this.pool.to(device);
        this.dropout.to(device);
      },
      train: () => {
        this.conv1.train();
        this.conv2.train();
        this.conv3.train();
        this.fc1.train();
        this.fc2.train();
        this.fc3.train();
      },
      eval: () => {
        this.conv1.eval();
        this.conv2.eval();
        this.conv3.eval();
        this.fc1.eval();
        this.fc2.eval();
        this.fc3.eval();
      }
    };
  }

  forward(x: any): any {
    // Conv block 1
    x = this.pool(torch_functional.relu(this.conv1(x)));

    // Conv block 2
    x = this.pool(torch_functional.relu(this.conv2(x)));

    // Conv block 3
    x = this.pool(torch_functional.relu(this.conv3(x)));

    // Flatten
    x = x.view(x.size(0), -1);

    // Fully connected layers
    x = torch_functional.relu(this.fc1(x));
    x = this.dropout(x);
    x = torch_functional.relu(this.fc2(x));
    x = this.dropout(x);
    x = this.fc3(x);

    return x;
  }
}

/**
 * ResNet Block for building ResNet architectures
 */
export class ResNetBlock {
  private conv1: any;
  private bn1: any;
  private conv2: any;
  private bn2: any;
  private shortcut: any;

  constructor(
    in_channels: number,
    out_channels: number,
    stride: number = 1,
    downsample: any = null
  ) {
    this.conv1 = torch_nn.Conv2d(in_channels, out_channels, 3, {
      stride: stride,
      padding: 1,
      bias: false
    });
    this.bn1 = torch_nn.BatchNorm2d(out_channels);

    this.conv2 = torch_nn.Conv2d(out_channels, out_channels, 3, {
      stride: 1,
      padding: 1,
      bias: false
    });
    this.bn2 = torch_nn.BatchNorm2d(out_channels);

    this.shortcut = downsample || torch_nn.Sequential();
  }

  forward(x: any): any {
    const residual = x;

    let out = this.conv1(x);
    out = this.bn1(out);
    out = torch_functional.relu(out);

    out = this.conv2(out);
    out = this.bn2(out);

    out = out.add(this.shortcut(residual));
    out = torch_functional.relu(out);

    return out;
  }

  to(device: any): void {
    this.conv1.to(device);
    this.bn1.to(device);
    this.conv2.to(device);
    this.bn2.to(device);
    this.shortcut.to(device);
  }
}

/**
 * ResNet-18 Architecture
 */
export class ResNet18 extends BaseNeuralNetwork {
  private conv1: any;
  private bn1: any;
  private layer1: ResNetBlock[];
  private layer2: ResNetBlock[];
  private layer3: ResNetBlock[];
  private layer4: ResNetBlock[];
  private avgpool: any;
  private fc: any;

  constructor(num_classes: number = 1000) {
    super();

    this.conv1 = torch_nn.Conv2d(3, 64, 7, { stride: 2, padding: 3, bias: false });
    this.bn1 = torch_nn.BatchNorm2d(64);
    this.avgpool = torch_nn.AdaptiveAvgPool2d([1, 1]);
    this.fc = torch_nn.Linear(512, num_classes);

    // Build ResNet layers
    this.layer1 = this.makeLayer(64, 64, 2, 1);
    this.layer2 = this.makeLayer(64, 128, 2, 2);
    this.layer3 = this.makeLayer(128, 256, 2, 2);
    this.layer4 = this.makeLayer(256, 512, 2, 2);

    this.buildModel();
    this.toDevice();
  }

  private makeLayer(
    in_channels: number,
    out_channels: number,
    blocks: number,
    stride: number
  ): ResNetBlock[] {
    const layers: ResNetBlock[] = [];

    // First block may downsample
    let downsample = null;
    if (stride !== 1 || in_channels !== out_channels) {
      downsample = torch_nn.Sequential(
        torch_nn.Conv2d(in_channels, out_channels, 1, { stride: stride, bias: false }),
        torch_nn.BatchNorm2d(out_channels)
      );
    }

    layers.push(new ResNetBlock(in_channels, out_channels, stride, downsample));

    // Remaining blocks
    for (let i = 1; i < blocks; i++) {
      layers.push(new ResNetBlock(out_channels, out_channels));
    }

    return layers;
  }

  private buildModel(): void {
    this.model = {
      forward: (x: any) => this.forward(x),
      parameters: () => {
        const params = [
          ...this.conv1.parameters(),
          ...this.bn1.parameters(),
          ...this.fc.parameters()
        ];

        for (const block of [...this.layer1, ...this.layer2, ...this.layer3, ...this.layer4]) {
          params.push(...block.conv1.parameters());
          params.push(...block.bn1.parameters());
          params.push(...block.conv2.parameters());
          params.push(...block.bn2.parameters());
        }

        return params;
      },
      to: (device: any) => {
        this.conv1.to(device);
        this.bn1.to(device);
        this.avgpool.to(device);
        this.fc.to(device);

        for (const block of [...this.layer1, ...this.layer2, ...this.layer3, ...this.layer4]) {
          block.to(device);
        }
      },
      train: () => {
        this.conv1.train();
        this.bn1.train();
        this.fc.train();
      },
      eval: () => {
        this.conv1.eval();
        this.bn1.eval();
        this.fc.eval();
      }
    };
  }

  forward(x: any): any {
    // Initial conv
    x = this.conv1(x);
    x = this.bn1(x);
    x = torch_functional.relu(x);
    x = torch_functional.max_pool2d(x, 3, { stride: 2, padding: 1 });

    // ResNet blocks
    for (const block of this.layer1) {
      x = block.forward(x);
    }
    for (const block of this.layer2) {
      x = block.forward(x);
    }
    for (const block of this.layer3) {
      x = block.forward(x);
    }
    for (const block of this.layer4) {
      x = block.forward(x);
    }

    // Final pooling and classification
    x = this.avgpool(x);
    x = x.view(x.size(0), -1);
    x = this.fc(x);

    return x;
  }
}

/**
 * LSTM Network for sequence modeling
 */
export class LSTMNetwork extends BaseNeuralNetwork {
  private lstm: any;
  private fc: any;
  private hidden_size: number;
  private num_layers: number;

  constructor(
    input_size: number,
    hidden_size: number,
    num_layers: number,
    output_size: number,
    dropout: number = 0.5
  ) {
    super();

    this.hidden_size = hidden_size;
    this.num_layers = num_layers;

    this.lstm = torch_nn.LSTM(input_size, hidden_size, {
      num_layers: num_layers,
      batch_first: true,
      dropout: dropout
    });

    this.fc = torch_nn.Linear(hidden_size, output_size);

    this.buildModel();
    this.toDevice();
  }

  private buildModel(): void {
    this.model = {
      forward: (x: any, hidden: any = null) => this.forward(x, hidden),
      parameters: () => [
        ...this.lstm.parameters(),
        ...this.fc.parameters()
      ],
      to: (device: any) => {
        this.lstm.to(device);
        this.fc.to(device);
      },
      train: () => {
        this.lstm.train();
        this.fc.train();
      },
      eval: () => {
        this.lstm.eval();
        this.fc.eval();
      }
    };
  }

  forward(x: any, hidden: any = null): any {
    // Initialize hidden state if not provided
    if (!hidden) {
      const h0 = torch.zeros(this.num_layers, x.size(0), this.hidden_size).to(this.device);
      const c0 = torch.zeros(this.num_layers, x.size(0), this.hidden_size).to(this.device);
      hidden = [h0, c0];
    }

    // Forward through LSTM
    const [out, new_hidden] = this.lstm(x, hidden);

    // Get output from last time step
    const out_last = out.slice([null, -1, null]);

    // Forward through fully connected layer
    const output = this.fc(out_last);

    return [output, new_hidden];
  }

  /**
   * Train LSTM on sequences
   */
  async trainSequences(
    X_train: any,
    y_train: any,
    X_val: any,
    y_val: any,
    epochs: number = 100,
    batch_size: number = 32,
    learning_rate: number = 0.001
  ): Promise<Record<string, number[]>> {
    const X_train_tensor = torch.FloatTensor(X_train).to(this.device);
    const y_train_tensor = torch.FloatTensor(y_train).to(this.device);
    const X_val_tensor = torch.FloatTensor(X_val).to(this.device);
    const y_val_tensor = torch.FloatTensor(y_val).to(this.device);

    this.optimizer = torch_optim.Adam(this.model.parameters(), { lr: learning_rate });
    this.criterion = torch_nn.MSELoss();

    const n_batches = Math.ceil(X_train_tensor.shape[0] / batch_size);

    for (let epoch = 0; epoch < epochs; epoch++) {
      this.model.train();
      let epoch_loss = 0;

      for (let i = 0; i < n_batches; i++) {
        const start = i * batch_size;
        const end = Math.min(start + batch_size, X_train_tensor.shape[0]);

        const batch_X = X_train_tensor.slice([start, end]);
        const batch_y = y_train_tensor.slice([start, end]);

        this.optimizer.zero_grad();
        const [outputs, _] = this.forward(batch_X);
        const loss = this.criterion(outputs, batch_y);

        loss.backward();
        torch_nn.utils.clip_grad_norm_(this.model.parameters(), 1.0);
        this.optimizer.step();

        epoch_loss += loss.item();
      }

      const train_loss = epoch_loss / n_batches;

      // Validation
      this.model.eval();
      let val_loss = 0;
      torch.no_grad(() => {
        const [val_outputs, _] = this.forward(X_val_tensor);
        val_loss = this.criterion(val_outputs, y_val_tensor).item();
      });

      this.history.train_loss.push(train_loss);
      this.history.val_loss.push(val_loss);

      console.log(
        `Epoch ${epoch + 1}/${epochs} - ` +
        `train_loss: ${train_loss.toFixed(4)} - val_loss: ${val_loss.toFixed(4)}`
      );
    }

    return this.history;
  }
}

/**
 * Variational Autoencoder (VAE)
 */
export class VAE extends BaseNeuralNetwork {
  private encoder_fc1: any;
  private encoder_fc2: any;
  private fc_mu: any;
  private fc_logvar: any;
  private decoder_fc1: any;
  private decoder_fc2: any;
  private decoder_fc3: any;
  private latent_dim: number;

  constructor(input_dim: number, latent_dim: number = 20) {
    super();

    this.latent_dim = latent_dim;

    // Encoder
    this.encoder_fc1 = torch_nn.Linear(input_dim, 512);
    this.encoder_fc2 = torch_nn.Linear(512, 256);
    this.fc_mu = torch_nn.Linear(256, latent_dim);
    this.fc_logvar = torch_nn.Linear(256, latent_dim);

    // Decoder
    this.decoder_fc1 = torch_nn.Linear(latent_dim, 256);
    this.decoder_fc2 = torch_nn.Linear(256, 512);
    this.decoder_fc3 = torch_nn.Linear(512, input_dim);

    this.buildModel();
    this.toDevice();
  }

  private buildModel(): void {
    this.model = {
      forward: (x: any) => this.forward(x),
      parameters: () => [
        ...this.encoder_fc1.parameters(),
        ...this.encoder_fc2.parameters(),
        ...this.fc_mu.parameters(),
        ...this.fc_logvar.parameters(),
        ...this.decoder_fc1.parameters(),
        ...this.decoder_fc2.parameters(),
        ...this.decoder_fc3.parameters()
      ],
      to: (device: any) => {
        this.encoder_fc1.to(device);
        this.encoder_fc2.to(device);
        this.fc_mu.to(device);
        this.fc_logvar.to(device);
        this.decoder_fc1.to(device);
        this.decoder_fc2.to(device);
        this.decoder_fc3.to(device);
      },
      train: () => {
        this.encoder_fc1.train();
        this.encoder_fc2.train();
        this.fc_mu.train();
        this.fc_logvar.train();
        this.decoder_fc1.train();
        this.decoder_fc2.train();
        this.decoder_fc3.train();
      },
      eval: () => {
        this.encoder_fc1.eval();
        this.encoder_fc2.eval();
        this.fc_mu.eval();
        this.fc_logvar.eval();
        this.decoder_fc1.eval();
        this.decoder_fc2.eval();
        this.decoder_fc3.eval();
      }
    };
  }

  encode(x: any): [any, any] {
    let h = torch_functional.relu(this.encoder_fc1(x));
    h = torch_functional.relu(this.encoder_fc2(h));
    const mu = this.fc_mu(h);
    const logvar = this.fc_logvar(h);
    return [mu, logvar];
  }

  reparameterize(mu: any, logvar: any): any {
    const std = torch.exp(logvar.mul(0.5));
    const eps = torch.randn_like(std);
    return mu.add(std.mul(eps));
  }

  decode(z: any): any {
    let h = torch_functional.relu(this.decoder_fc1(z));
    h = torch_functional.relu(this.decoder_fc2(h));
    return torch.sigmoid(this.decoder_fc3(h));
  }

  forward(x: any): [any, any, any] {
    const [mu, logvar] = this.encode(x);
    const z = this.reparameterize(mu, logvar);
    const recon_x = this.decode(z);
    return [recon_x, mu, logvar];
  }

  /**
   * VAE loss function
   */
  lossFunction(recon_x: any, x: any, mu: any, logvar: any): any {
    // Reconstruction loss
    const BCE = torch_functional.binary_cross_entropy(
      recon_x,
      x.view(-1, recon_x.size(1)),
      { reduction: 'sum' }
    );

    // KL divergence
    const KLD = -0.5 * torch.sum(
      logvar.sub(logvar.exp()).sub(mu.pow(2)).add(1)
    );

    return BCE.add(KLD);
  }

  /**
   * Train VAE
   */
  async trainVAE(
    X_train: any,
    X_val: any,
    epochs: number = 100,
    batch_size: number = 128,
    learning_rate: number = 0.001
  ): Promise<Record<string, number[]>> {
    const X_train_tensor = torch.FloatTensor(X_train).to(this.device);
    const X_val_tensor = torch.FloatTensor(X_val).to(this.device);

    this.optimizer = torch_optim.Adam(this.model.parameters(), { lr: learning_rate });

    const n_batches = Math.ceil(X_train_tensor.shape[0] / batch_size);

    for (let epoch = 0; epoch < epochs; epoch++) {
      this.model.train();
      let train_loss = 0;

      for (let i = 0; i < n_batches; i++) {
        const start = i * batch_size;
        const end = Math.min(start + batch_size, X_train_tensor.shape[0]);

        const batch_X = X_train_tensor.slice([start, end]);

        this.optimizer.zero_grad();
        const [recon_batch, mu, logvar] = this.forward(batch_X);
        const loss = this.lossFunction(recon_batch, batch_X, mu, logvar);

        loss.backward();
        this.optimizer.step();

        train_loss += loss.item();
      }

      train_loss /= X_train_tensor.shape[0];

      // Validation
      this.model.eval();
      let val_loss = 0;
      torch.no_grad(() => {
        const [recon_val, mu_val, logvar_val] = this.forward(X_val_tensor);
        val_loss = this.lossFunction(
          recon_val,
          X_val_tensor,
          mu_val,
          logvar_val
        ).item() / X_val_tensor.shape[0];
      });

      this.history.train_loss.push(train_loss);
      this.history.val_loss.push(val_loss);

      console.log(
        `Epoch ${epoch + 1}/${epochs} - ` +
        `train_loss: ${train_loss.toFixed(4)} - val_loss: ${val_loss.toFixed(4)}`
      );
    }

    return this.history;
  }

  /**
   * Generate new samples
   */
  generate(num_samples: number = 1): any {
    this.model.eval();
    let samples: any;

    torch.no_grad(() => {
      const z = torch.randn(num_samples, this.latent_dim).to(this.device);
      samples = this.decode(z).cpu().numpy();
    });

    return samples;
  }
}

/**
 * Generative Adversarial Network (GAN)
 */
export class GAN {
  private generator: any;
  private discriminator: any;
  private device: any;
  private latent_dim: number;

  constructor(latent_dim: number, output_dim: number) {
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
    this.latent_dim = latent_dim;

    // Generator
    this.generator = torch_nn.Sequential(
      torch_nn.Linear(latent_dim, 256),
      torch_nn.ReLU(),
      torch_nn.Linear(256, 512),
      torch_nn.ReLU(),
      torch_nn.Linear(512, 1024),
      torch_nn.ReLU(),
      torch_nn.Linear(1024, output_dim),
      torch_nn.Tanh()
    );

    // Discriminator
    this.discriminator = torch_nn.Sequential(
      torch_nn.Linear(output_dim, 1024),
      torch_nn.LeakyReLU(0.2),
      torch_nn.Dropout(0.3),
      torch_nn.Linear(1024, 512),
      torch_nn.LeakyReLU(0.2),
      torch_nn.Dropout(0.3),
      torch_nn.Linear(512, 256),
      torch_nn.LeakyReLU(0.2),
      torch_nn.Dropout(0.3),
      torch_nn.Linear(256, 1),
      torch_nn.Sigmoid()
    );

    this.generator.to(this.device);
    this.discriminator.to(this.device);
  }

  /**
   * Train GAN
   */
  async trainGAN(
    real_data: any,
    epochs: number = 100,
    batch_size: number = 64,
    learning_rate: number = 0.0002
  ): Promise<void> {
    const real_data_tensor = torch.FloatTensor(real_data).to(this.device);

    const optimizer_G = torch_optim.Adam(
      this.generator.parameters(),
      { lr: learning_rate, betas: [0.5, 0.999] }
    );

    const optimizer_D = torch_optim.Adam(
      this.discriminator.parameters(),
      { lr: learning_rate, betas: [0.5, 0.999] }
    );

    const criterion = torch_nn.BCELoss();
    const n_batches = Math.ceil(real_data_tensor.shape[0] / batch_size);

    for (let epoch = 0; epoch < epochs; epoch++) {
      let d_loss_total = 0;
      let g_loss_total = 0;

      for (let i = 0; i < n_batches; i++) {
        const start = i * batch_size;
        const end = Math.min(start + batch_size, real_data_tensor.shape[0]);
        const current_batch_size = end - start;

        // Train Discriminator
        optimizer_D.zero_grad();

        const real_batch = real_data_tensor.slice([start, end]);
        const real_labels = torch.ones(current_batch_size, 1).to(this.device);

        const real_output = this.discriminator(real_batch);
        const d_loss_real = criterion(real_output, real_labels);

        const noise = torch.randn(current_batch_size, this.latent_dim).to(this.device);
        const fake_batch = this.generator(noise);
        const fake_labels = torch.zeros(current_batch_size, 1).to(this.device);

        const fake_output = this.discriminator(fake_batch.detach());
        const d_loss_fake = criterion(fake_output, fake_labels);

        const d_loss = d_loss_real.add(d_loss_fake);
        d_loss.backward();
        optimizer_D.step();

        // Train Generator
        optimizer_G.zero_grad();

        const noise_g = torch.randn(current_batch_size, this.latent_dim).to(this.device);
        const fake_batch_g = this.generator(noise_g);
        const output_g = this.discriminator(fake_batch_g);

        const g_loss = criterion(output_g, real_labels);
        g_loss.backward();
        optimizer_G.step();

        d_loss_total += d_loss.item();
        g_loss_total += g_loss.item();
      }

      console.log(
        `Epoch ${epoch + 1}/${epochs} - ` +
        `D_loss: ${(d_loss_total / n_batches).toFixed(4)} - ` +
        `G_loss: ${(g_loss_total / n_batches).toFixed(4)}`
      );
    }
  }

  /**
   * Generate fake samples
   */
  generateSamples(num_samples: number): any {
    this.generator.eval();
    let samples: any;

    torch.no_grad(() => {
      const noise = torch.randn(num_samples, this.latent_dim).to(this.device);
      samples = this.generator(noise).cpu().numpy();
    });

    return samples;
  }
}

export default {
  MLP,
  ConvNet,
  ResNet18,
  LSTMNetwork,
  VAE,
  GAN
};
