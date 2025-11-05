---
layout: post
title: Design Patterns - Gateway
date: 2025-11-05T08:39:18.200Z
tags:
  - design patterns
  - php
  - programming
  - series
  - how-to
  - gateway
---
Fifteen years after my original posts on design patterns in PHP, this series revisits those ideas with modern tools. Using Phalcon v6 and a small REST API example, it demonstrates the [Gateway pattern][gateway] to decouple application logic from external payment providers, showing a minimal, testable interface and concrete adapters so you can swap processors without changing business code.


## REST API - Phalcon v6

Recently I have been working on a series of [videos][rest_videos] for [Phalcon][phalcon], demonstrating how one can create a REST API with Phalcon v6.

[Phalcon v6][phalcon_v6] is the version of Phalcon written solely in PHP, which will facilitate easier installation via Composer, especially in environments where installing a PHP extension is not possible. At the time of posting, only the PHQL parser has been converted from C to PHP; an Alpha release is expected soon.

The PHQL parser is the engine behind the Models for Phalcon (the M in MVC). However, we started an effort to introduce the Data Mapper pattern in the framework, and although not fully complete, we can use the basic objects to interact with the database as well as the relevant Connection object. With those, we can create our API application with Phalcon v6.

## Problem to solve

One of the future tasks for the video series is to connect our API to some fictional payment processor, so that we can process payments from the front end. The task is simple, an API call from our application to the vendor's API, get the response back, parse it as needed and return the results back to the front end. 

The obvious question is which payment processor are we using, and what happens if a different payment processor appears in the future that we need to interact with? How will our code change, and will that small change break everything?

To deal with this problem, we can introduce the [Gateway pattern][gateway].

The idea of the pattern is simple. We define a thin interface (the "gateway") that abstracts an external system, so that our application knows one and only one way to interact with it.

Accompanying the gateway pattern are more concrete implementations that translate the interface's method calls into whatever each payment provider (external system) requires. Those can be anything, from REST, SOAP, SDK etc.

The chosen adapter implementing the gateway is then injected so the application stays decoupled from the implementation details of the external system.


## Example

The example is an order processing system

### OrderItem

Each ordered item — a line item in accounting.

```php
<?php

declare(strict_types=1);

final class OrderItem
{
    public function __construct(
        public readonly string $sku,
        public readonly int $quantity,
        public readonly float $unitPrice
    ) {}

    public function total(): float
    {
        return $this->quantity * $this->unitPrice;
    }
}
```

### Order

The collection of OrderItems

```php
<?php

declare(strict_types=1);

final class Order
{
    /** @var OrderItem[] */
    private array $items = [];

    public function __construct(
        public readonly string $orderId
    ) {
    }

    public function addItem(OrderItem $item): void
    {
        $this->items[] = $item;
    }


    /** @return OrderItem[] */
    public function items(): array
    {
        return $this->items;
    }
    
    public function totalAmount(): float
    {
        return array_reduce(
            $this->items,
            fn (float $c, OrderItem $i) => $c + $i->total(),
            0.0
        );
    }
}
```

### OrderRepository

Abstraction for the database

```php
<?php

declare(strict_types=1);

interface OrderRepository
{
    public function save(Order $order): void;
}

// For MySql
final class MySqlOrderRepository implements OrderRepository
{
    public function __construct(
        private PDO $pdo
    ) {
    }

    public function save(Order $order): void
    {
        // Save records here in MySQL
    }
}
```

## Gateway Pattern

To implement our pattern we will need to create a contract with the rest of the application. Of course this is an interface and we need to keep it as thin as possible, just enough to express our business needs.

### Interface

```php
<?php

declare(strict_types=1);

use Phalcon\Domain\Payload;

interface PaymentGatewayInterface
{
    /**
     * Charge a monetary amount for a given order.
     *
     * @param string $orderId   Identifier of the order being paid.
     * @param float  $amount    Amount in the currency's smallest unit (e.g. dollars)
     * @param string $currency  ISO‑4217 code, e.g. "USD".
     *
     * @return Payload   Information about success / failure.
     */
    public function charge(
        string $orderId, 
        float $amount, 
        string $currency
    ): Payload;
}
```

### Transport object

To standardize the communication between the gateway and our application, we will use the  [Payload][payload] object that Phalcon offers, which in turn implements the [PayloadInterop][payload_interop] interface. 

A sample message back could be represented by the following:

```php
<?php

declare(strict_types=1);

use PayloadInterop\DomainStatus;
use Phalcon\Domain\Payload;

// Success
return new Payload(
    DomainStatus::SUCCESS,
    [
        'data' => [
            'transactionId' => '123456789'
        ]
    ]
);


// Error
return new Payload(
    DomainStatus::ERROR,
    [
        'errors' => [
            ['error message 1'],
            ['error message 2'],
        ]
    ]
);
```

### Adapter - Implementation

This is the concrete implementation that talks to an external/third-party provider. Such providers can be Stripe, Paypal etc. Depending on the provider, different dependencies will be injected (e.g. HTTP client, SDK etc.)
 
```php
<?php

declare(strict_types=1);

use PayloadInterop\DomainStatus;
use Phalcon\Domain\Payload;

final class StripeGateway implements PaymentGatewayInterface
{
    /** @var array<string, string> */
    private array $store = [];

    public function charge(
        string $orderId, 
        float $amount, 
        string $currency
    ): Payload {
        // Simulate network latency / random failure
        usleep(random_int(50_000, 150_000));

        // Reject anything above 500 USD (for demo purposes)
        if ($amount > 500.0) {
            return new Payload(
                DomainStatus::ERROR,
                [
                    'errors' => [
                        'Amount exceeds limit for the Stripe gateway.'
                    ]
                ]
            );
        }

        // Generate a fake transaction id
        $txId = 'tx_' . bin2hex(random_bytes(8));
        $this->store[$txId] = $orderId;

        return new Payload(
            DomainStatus::SUCCESS,
            [
                'data' => [
                    'transactionId' => $txId
                ]
            ]
        );
    }
}
```

As you can see, the `StripeGateway` implements our interface, and any processing in there is specific to `Stripe` alone. Other gateways will have different implementations, but the key is that they all implement the same interface, and they all return the same type of message (`Payload`).

## Application

Finally our application can now use this gateway and process orders, irrespective of the external provider we have chosen

```php
<?php

declare(strict_types=1);

final class OrderProcessor
{
    public function __construct(
        private OrderRepository $repository,
        private PaymentGatewayInterface $paymentGateway
    ) {}

    /**
     * Build an order, persist it, then attempt payment.
     *
     * @return array{order:Order, payment:Payload}
     */
    public function placeOrder(array $items, string $currency = 'USD'): array
    {
        // Build the domain object
        $order = new Order(uniqid('ord_')); // some random ID
        foreach ($items as $row) {
            $order->addItem(
                new OrderItem(
                    $row['sku'],
                    $row['quantity'],
                    $row['price']
                )
            );
        }

        // Use the repository to save it
        $this->repository->save($order);

        // Perform the payment
        $result = $this->paymentGateway->charge(
            $order->orderId,
            $order->totalAmount(),
            $currency
        );

        return [
            'order'   => $order,
            'payment' => $result,
        ];
    }
}
```

## Conclusion

Because of the gateway living behind an interface, we can have increased testability. We can inject a stub or a mock that returns predetermined results, and thus test our application code accordingly.

We also gain flexibility, because now we only have to replace the payment processor with another that implements the gateway interface, and our application code remains intact.

Finally, an extension of this would be to use a factory that generates payment processors (all implementing the interface). This way, one can implement conditionals based on environment variables that will generate the appropriate payment gateway class to be injected in the `OrderProcessor`.


[gateway]: https://martinfowler.com/eaaCatalog/gateway.html
[payload]: https://github.com/phalcon/phalcon/blob/v6.0.x/src/Domain/Payload.php
[payload_interop]: https://github.com/payload-interop/payload-interop
[phalcon]: https://phalcon.io
[phalcon_v6]: https://github.com/phalcon/phalcon
[rest_videos]: https://www.youtube.com/watch?v=GaJhNnw_1cE&list=PLgJ0OtNTm8n9dBSTxJutB7D9APBaNtHyt
